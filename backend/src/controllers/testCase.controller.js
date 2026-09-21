import asyncHandler from '../utils/asyncHandler.js';
import * as testCaseService from '../services/testCase.service.js';

/**
 * POST /api/test-cases/generate
 * Draft only — never persists to MongoDB.
 */
export const generateTestCases = asyncHandler(async (req, res) => {
  const { requirement } = req.body;
  const data = await testCaseService.generateDraftTestCases({ requirement });

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * POST /api/test-cases
 * Explicit Save boundary.
 */
export const saveTestCases = asyncHandler(async (req, res) => {
  const { userId, requirementId, requirement, testCases } = req.body;
  const data = await testCaseService.saveTestCases({
    userId,
    requirementId,
    requirement,
    testCases,
  });

  res.status(201).json({
    success: true,
    data,
  });
});

/**
 * GET /api/requirements/:requirementId/test-cases
 */
export const getTestCases = asyncHandler(async (req, res) => {
  const { requirementId } = req.params;
  const { userId } = req.query;
  const data = await testCaseService.getTestCasesForRequirement(userId, requirementId);

  res.status(200).json({
    success: true,
    data,
  });
});

/**
 * PUT /api/requirements/:requirementId/test-cases
 */
export const updateTestCases = asyncHandler(async (req, res) => {
  const { requirementId } = req.params;
  const { userId, testCases } = req.body;
  const data = await testCaseService.updateTestCasesForRequirement(
    userId,
    requirementId,
    testCases
  );

  res.status(200).json({
    success: true,
    data,
  });
});
