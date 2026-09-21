import dotenv from 'dotenv';

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseModels = (value) => {
  if (!value || typeof value !== 'string') {
    return [
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
    ];
  }

  return value
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);
};

const env = {
  port: toInt(process.env.PORT, 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/test-case-generatorr',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModels: parseModels(process.env.GEMINI_MODELS),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  minRequirementLength: toInt(process.env.MIN_REQUIREMENT_LENGTH, 10),
  maxRequirementLength: toInt(process.env.MAX_REQUIREMENT_LENGTH, 10000),
  aiMaxRetriesPerModel: toInt(process.env.AI_MAX_RETRIES_PER_MODEL, 2),
  aiRequestTimeoutMs: toInt(process.env.AI_REQUEST_TIMEOUT_MS, 30000),
  backendRateLimitWindowMs: toInt(process.env.BACKEND_RATE_LIMIT_WINDOW_MS, 900000),
  backendRateLimitMax: toInt(process.env.BACKEND_RATE_LIMIT_MAX, 30),
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
};

export default env;
