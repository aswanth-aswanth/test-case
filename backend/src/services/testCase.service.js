import crypto from 'crypto';
import mongoose from 'mongoose';
import TestCaseSet from '../models/testCaseSet.model.js';
import Requirement from '../models/requirement.model.js';
import { upsertRequirement, getRequirementById } from './requirement.service.js';
import { generateTestCases as generateWithAi } from './ai.service.js';
import AppError from '../utils/AppError.js';

/**
 * Generate draft test cases via Gemini.
 * NEVER persists to MongoDB.
 */
export const generateDraftTestCases = async ({ requirement }) => {
  const result = await generateWithAi({ requirement });

  return {
    testCases: result.testCases,
  };
};

/**
 * Explicit save: persist requirement metadata + TestCaseSet together.
 * No AI call.
 */
export const saveTestCases = async ({
  userId,
  requirementId,
  requirement,
  testCases,
}) => {
  const session = await mongoose.startSession();
  let savedRequirementId = requirementId || crypto.randomUUID();

  const persist = async (activeSession) => {
    const { requirementId: id } = await upsertRequirement(
      {
        userId,
        requirementId: savedRequirementId,
        prompt: requirement,
      },
      activeSession
    );

    savedRequirementId = id;

    const filter = { userId, requirementId: savedRequirementId };
    const update = {
      $set: {
        userId,
        requirementId: savedRequirementId,
        testCases,
      },
    };
    const options = {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      ...(activeSession ? { session: activeSession } : {}),
    };

    const testCaseSet = await TestCaseSet.findOneAndUpdate(filter, update, options);

    return {
      requirementId: savedRequirementId,
      requirement,
      testCases: testCaseSet.testCases,
      updatedAt: testCaseSet.updatedAt,
    };
  };

  try {
    session.startTransaction();
    const data = await persist(session);
    await session.commitTransaction();
    return data;
  } catch (error) {
    await session.abortTransaction();

    if (
      error?.message?.includes('Transaction numbers are only allowed') ||
      error?.codeName === 'IllegalOperation' ||
      error?.code === 20
    ) {
      console.warn(
        'MongoDB transactions unavailable — falling back to sequential save'
      );
      return persist(null);
    }

    if (error instanceof AppError) {
      throw error;
    }

    console.error('Database error during save:', error.message);
    throw new AppError('Failed to save test cases.', 500, 'DATABASE_ERROR');
  } finally {
    session.endSession();
  }
};

/**
 * Retrieve test cases for ONE requirement with ownership check.
 */
export const getTestCasesForRequirement = async (userId, requirementId) => {
  // Verify the requirement belongs to this user first.
  await getRequirementById(userId, requirementId);

  const testCaseSet = await TestCaseSet.findOne({ userId, requirementId }).lean();

  if (!testCaseSet) {
    throw new AppError('Test cases not found.', 404, 'TEST_CASES_NOT_FOUND');
  }

  return {
    requirementId,
    testCases: testCaseSet.testCases,
  };
};

/**
 * Update saved test cases for an existing requirement.
 */
export const updateTestCasesForRequirement = async (
  userId,
  requirementId,
  testCases
) => {
  await getRequirementById(userId, requirementId);

  const testCaseSet = await TestCaseSet.findOneAndUpdate(
    { userId, requirementId },
    { $set: { testCases } },
    { new: true }
  );

  if (!testCaseSet) {
    throw new AppError('Test cases not found.', 404, 'TEST_CASES_NOT_FOUND');
  }

  // Touch requirement updatedAt for sidebar ordering.
  await Requirement.updateOne(
    { userId, 'requirements.requirementId': requirementId },
    { $set: { 'requirements.$.updatedAt': new Date() } }
  );

  return {
    requirementId,
    testCases: testCaseSet.testCases,
    updatedAt: testCaseSet.updatedAt,
  };
};

export default {
  generateDraftTestCases,
  saveTestCases,
  getTestCasesForRequirement,
  updateTestCasesForRequirement,
};
