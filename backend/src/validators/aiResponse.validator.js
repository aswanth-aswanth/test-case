import { z } from 'zod';
import AppError from '../utils/AppError.js';
import { testCaseSchema } from './testCase.validator.js';

export const aiTestCaseResponseSchema = z.object({
  testCases: z
    .array(testCaseSchema)
    .min(1, 'AI must return at least one test case.'),
});

/**
 * Structural Zod validation for AI output.
 * Does not expose raw AI content in error messages.
 */
export const validateAiResponse = (payload) => {
  if (payload === null || payload === undefined) {
    throw new AppError(
      'The AI returned an invalid test case structure. Please try again.',
      502,
      'AI_INVALID_OUTPUT'
    );
  }

  if (typeof payload !== 'object' || Array.isArray(payload)) {
    throw new AppError(
      'The AI returned an invalid test case structure. Please try again.',
      502,
      'AI_INVALID_OUTPUT'
    );
  }

  const result = aiTestCaseResponseSchema.safeParse(payload);

  if (!result.success) {
    throw new AppError(
      'The AI returned an invalid test case structure. Please try again.',
      502,
      'AI_INVALID_OUTPUT'
    );
  }

  const testCases = result.data.testCases;

  const ids = testCases.map((tc) => tc.testCaseId.toLowerCase());
  if (new Set(ids).size !== ids.length) {
    throw new AppError(
      'The AI returned an invalid test case structure. Please try again.',
      502,
      'AI_INVALID_OUTPUT'
    );
  }

  const titles = testCases.map((tc) => tc.title.trim().toLowerCase());
  if (new Set(titles).size !== titles.length) {
    throw new AppError(
      'The AI returned an invalid test case structure. Please try again.',
      502,
      'AI_INVALID_OUTPUT'
    );
  }

  return result.data;
};

export default validateAiResponse;
