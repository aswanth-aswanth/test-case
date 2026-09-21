import { GoogleGenAI } from '@google/genai';
import env from '../config/env.js';
import { buildTestCasePrompt } from '../prompts/testCase.prompt.js';
import { testCaseResponseJsonSchema } from '../schemas/testCase.schema.js';
import { validateAiResponse } from '../validators/aiResponse.validator.js';
import { validateSemantics } from './semantic.service.js';
import { withRetry } from '../utils/retry.js';
import AppError from '../utils/AppError.js';

let genAIClient = null;

const getClient = () => {
  if (!env.geminiApiKey || env.geminiApiKey === 'your_gemini_api_key') {
    throw new AppError(
      'The AI service is not configured correctly.',
      500,
      'AI_CONFIGURATION_ERROR'
    );
  }

  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey: env.geminiApiKey });
  }

  return genAIClient;
};

/**
 * Extract a status / error code from Gemini SDK errors.
 */
const extractErrorMeta = (error) => {
  const status =
    error?.status ||
    error?.statusCode ||
    error?.code ||
    error?.error?.code ||
    error?.response?.status ||
    null;

  const message = String(
    error?.message || error?.error?.message || error?.statusText || ''
  ).toLowerCase();

  const statusString = String(status || '').toLowerCase();

  return { status, statusString, message };
};

/**
 * Configuration / auth errors must NOT trigger model fallback.
 */
export const isConfigurationError = (error) => {
  if (error instanceof AppError && error.code === 'AI_CONFIGURATION_ERROR') {
    return true;
  }

  const { status, statusString, message } = extractErrorMeta(error);

  if (status === 401 || status === 403 || statusString === '401' || statusString === '403') {
    return true;
  }

  return (
    message.includes('api key') ||
    message.includes('api_key') ||
    message.includes('invalid key') ||
    message.includes('permission denied') ||
    message.includes('unauthenticated') ||
    message.includes('unauthorized') ||
    message.includes('consumer_invalid') ||
    message.includes('api_key_invalid')
  );
};

/**
 * Transient / capacity errors that warrant retry and model fallback.
 */
export const isRetryableAiError = (error) => {
  if (error instanceof AppError) {
    return ['AI_RATE_LIMITED', 'AI_TIMEOUT', 'AI_UNAVAILABLE'].includes(error.code);
  }

  if (isConfigurationError(error)) {
    return false;
  }

  const { status, statusString, message } = extractErrorMeta(error);
  const numericStatus = Number(status);

  if ([429, 500, 502, 503, 504].includes(numericStatus)) {
    return true;
  }

  if (['429', '500', '502', '503', '504', 'resource_exhausted'].includes(statusString)) {
    return true;
  }

  return (
    message.includes('resource_exhausted') ||
    message.includes('rate limit') ||
    message.includes('quota') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('deadline') ||
    message.includes('unavailable') ||
    message.includes('overloaded') ||
    message.includes('econnreset') ||
    message.includes('enotfound') ||
    message.includes('network') ||
    message.includes('fetch failed') ||
    message.includes('503') ||
    message.includes('502') ||
    message.includes('504') ||
    message.includes('429') ||
    error?.name === 'AbortError' ||
    error?.name === 'TimeoutError'
  );
};

/**
 * Normalize provider errors into application-level AppErrors.
 * Never expose raw Gemini error payloads to clients.
 */
export const normalizeAiError = (error) => {
  if (error instanceof AppError) {
    return error;
  }

  if (isConfigurationError(error)) {
    return new AppError(
      'The AI service is not configured correctly.',
      500,
      'AI_CONFIGURATION_ERROR'
    );
  }

  const { status, statusString, message } = extractErrorMeta(error);
  const numericStatus = Number(status);

  if (
    error?.name === 'AbortError' ||
    error?.name === 'TimeoutError' ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('deadline')
  ) {
    return new AppError(
      'The AI request took too long. Please try again.',
      504,
      'AI_TIMEOUT'
    );
  }

  if (
    numericStatus === 429 ||
    statusString === '429' ||
    message.includes('resource_exhausted') ||
    message.includes('rate limit') ||
    message.includes('quota')
  ) {
    return new AppError(
      'The AI service is temporarily busy. Please try again shortly.',
      429,
      'AI_RATE_LIMITED'
    );
  }

  if (
    [500, 502, 503, 504].includes(numericStatus) ||
    message.includes('unavailable') ||
    message.includes('overloaded')
  ) {
    return new AppError(
      'The AI service is temporarily unavailable. Please try again.',
      503,
      'AI_UNAVAILABLE'
    );
  }

  return new AppError(
    'The AI service is temporarily unavailable. Please try again.',
    503,
    'AI_UNAVAILABLE'
  );
};

const parseStructuredResponse = (response) => {
  const text =
    typeof response?.text === 'string'
      ? response.text
      : response?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text)
          .filter(Boolean)
          .join('') || '';

  if (!text || !text.trim()) {
    throw new AppError(
      'The AI returned an invalid test case structure. Please try again.',
      502,
      'AI_INVALID_OUTPUT'
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new AppError(
      'The AI returned an invalid test case structure. Please try again.',
      502,
      'AI_INVALID_OUTPUT'
    );
  }
};

/**
 * Single Gemini generateContent call with timeout via AbortController.
 */
const callGeminiModel = async (model, prompt) => {
  const client = getClient();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), env.aiRequestTimeoutMs);

  try {
    console.log(`AI request started | model=${model}`);

    const response = await client.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: testCaseResponseJsonSchema,
        abortSignal: controller.signal,
        temperature: 0.4,
      },
    });

    console.log(`AI request succeeded | model=${model}`);
    return response;
  } catch (error) {
    if (error?.name === 'AbortError' || controller.signal.aborted) {
      throw new AppError(
        'The AI request took too long. Please try again.',
        504,
        'AI_TIMEOUT'
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Level 1: retry current model with bounded exponential backoff + jitter.
 * Level 2: fall through to next model in GEMINI_MODELS.
 *
 * IMPORTANT: This function NEVER writes to MongoDB.
 */
export const generateTestCases = async ({ requirement, title }) => {
  if (!Array.isArray(env.geminiModels) || env.geminiModels.length === 0) {
    throw new AppError(
      'The AI service is not configured correctly.',
      500,
      'AI_CONFIGURATION_ERROR'
    );
  }

  // Fail fast on missing/placeholder API key — do not enter the fallback chain.
  getClient();

  const prompt = buildTestCasePrompt(requirement, title);
  let lastNormalizedError = null;

  for (let modelIndex = 0; modelIndex < env.geminiModels.length; modelIndex += 1) {
    const model = env.geminiModels[modelIndex];

    if (modelIndex > 0) {
      console.log(`AI fallback model selected | model=${model}`);
    } else {
      console.log(`AI model selected | model=${model}`);
    }

    try {
      const response = await withRetry(() => callGeminiModel(model, prompt), {
        maxRetries: env.aiMaxRetriesPerModel,
        baseDelayMs: 500,
        maxDelayMs: 8000,
        shouldRetry: (error) => isRetryableAiError(error),
        onRetry: ({ attempt, delay, error }) => {
          const normalized = normalizeAiError(error);
          console.warn(
            `AI retry | model=${model} | attempt=${attempt} | delayMs=${delay} | code=${normalized.code}`
          );
        },
      });

      const parsed = parseStructuredResponse(response);
      const structurallyValid = validateAiResponse(parsed);
      const semanticallyValid = validateSemantics(requirement, structurallyValid);

      return {
        testCases: semanticallyValid.testCases,
        modelUsed: model,
      };
    } catch (error) {
      // Invalid AI output is not fixed by switching models in most cases,
      // but a single retry-path via next model can still help with flaky generations.
      if (error instanceof AppError && error.code === 'AI_INVALID_OUTPUT') {
        console.warn(`AI invalid output | model=${model}`);
        lastNormalizedError = error;

        // Try next model if available; otherwise surface invalid output.
        if (modelIndex < env.geminiModels.length - 1) {
          continue;
        }
        throw error;
      }

      if (isConfigurationError(error)) {
        console.error('AI configuration error — aborting fallback chain');
        throw normalizeAiError(error);
      }

      lastNormalizedError = normalizeAiError(error);
      console.warn(
        `AI request failed | model=${model} | code=${lastNormalizedError.code}`
      );

      if (!isRetryableAiError(error) && !(error instanceof AppError && isRetryableAiError(error))) {
        // Non-retryable application errors should stop the chain.
        if (error instanceof AppError && !isRetryableAiError(error)) {
          throw lastNormalizedError;
        }
      }

      // Continue to next fallback model for retryable failures.
      if (modelIndex === env.geminiModels.length - 1) {
        throw lastNormalizedError;
      }
    }
  }

  throw (
    lastNormalizedError ||
    new AppError(
      'The AI service is temporarily unavailable. Please try again.',
      503,
      'AI_UNAVAILABLE'
    )
  );
};

export default {
  generateTestCases,
  normalizeAiError,
  isRetryableAiError,
  isConfigurationError,
};
