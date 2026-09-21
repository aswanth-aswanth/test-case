import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import validate from '../middleware/validate.js';
import {
  generateTestCasesSchema,
  saveTestCasesSchema,
} from '../validators/testCase.validator.js';
import * as testCaseController from '../controllers/testCase.controller.js';
import env from '../config/env.js';

const router = Router();

/**
 * Application-level rate limit for AI generation.
 * This is independent of Gemini provider rate limits.
 */
const generateRateLimiter = rateLimit({
  windowMs: env.backendRateLimitWindowMs,
  max: env.backendRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMITED',
      message:
        'Too many generation requests from this client. Please try again later.',
    },
  },
});

router.post(
  '/generate',
  generateRateLimiter,
  validate(generateTestCasesSchema),
  testCaseController.generateTestCases
);

router.post(
  '/',
  validate(saveTestCasesSchema),
  testCaseController.saveTestCases
);

export default router;
