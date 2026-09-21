import crypto from 'crypto';
import mongoose from 'mongoose';
import Requirement from '../models/requirement.model.js';
import TestCaseSet from '../models/testCaseSet.model.js';
import AppError from '../utils/AppError.js';

const toRequirementDto = (item) => ({
  requirementId: item.requirementId,
  prompt: item.prompt,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

/**
 * Ensure a requirement-container document exists for the anonymous user.
 */
export const ensureUserContainer = async (userId, session = null) => {
  let query = Requirement.findOne({ userId });
  if (session) {
    query = query.session(session);
  }

  let doc = await query;

  if (!doc) {
    if (session) {
      const created = await Requirement.create(
        [{ userId, requirements: [] }],
        { session }
      );
      doc = created[0];
    } else {
      doc = await Requirement.create({ userId, requirements: [] });
    }
  }

  return doc;
};

/**
 * List requirement metadata only — never joins TestCaseSet.
 */
export const listRequirements = async (userId) => {
  const container = await Requirement.findOne({ userId }).lean();

  if (!container) {
    return { requirements: [] };
  }

  const requirements = [...container.requirements]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .map(toRequirementDto);

  return { requirements };
};

/**
 * Get a single requirement by ownership (userId + requirementId).
 */
export const getRequirementById = async (userId, requirementId) => {
  const container = await Requirement.findOne({
    userId,
    'requirements.requirementId': requirementId,
  }).lean();

  if (!container) {
    throw new AppError('Requirement not found.', 404, 'REQUIREMENT_NOT_FOUND');
  }

  const item = container.requirements.find((r) => r.requirementId === requirementId);

  if (!item) {
    throw new AppError('Requirement not found.', 404, 'REQUIREMENT_NOT_FOUND');
  }

  return toRequirementDto(item);
};

/**
 * Upsert requirement metadata inside the user's container.
 * If requirementId is provided and exists, update it.
 * If requirementId is provided but missing, create with that id.
 * If omitted, generate a new id.
 */
export const upsertRequirement = async (
  { userId, requirementId, prompt },
  session = null
) => {
  const container = await ensureUserContainer(userId, session);
  const now = new Date();
  const id = requirementId || crypto.randomUUID();

  const existingIndex = container.requirements.findIndex(
    (r) => r.requirementId === id
  );

  if (existingIndex >= 0) {
    container.requirements[existingIndex].prompt = prompt;
    container.requirements[existingIndex].updatedAt = now;
  } else {
    container.requirements.push({
      requirementId: id,
      prompt,
      createdAt: now,
      updatedAt: now,
    });
  }

  await container.save(session ? { session } : undefined);

  return { requirementId: id, container };
};

/**
 * Delete requirement metadata + associated TestCaseSet.
 * Prefer a transaction when the MongoDB deployment supports it.
 */
export const deleteRequirement = async (userId, requirementId) => {
  const container = await Requirement.findOne({
    userId,
    'requirements.requirementId': requirementId,
  });

  if (!container) {
    throw new AppError('Requirement not found.', 404, 'REQUIREMENT_NOT_FOUND');
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    container.requirements = container.requirements.filter(
      (r) => r.requirementId !== requirementId
    );
    await container.save({ session });

    await TestCaseSet.deleteOne({ userId, requirementId }).session(session);

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();

    // Standalone MongoDB without replica set may reject transactions.
    // Fall back to sequential deletes with careful cleanup.
    if (
      error?.message?.includes('Transaction numbers are only allowed') ||
      error?.codeName === 'IllegalOperation' ||
      error?.code === 20
    ) {
      console.warn(
        'MongoDB transactions unavailable — falling back to sequential delete'
      );

      const fresh = await Requirement.findOne({
        userId,
        'requirements.requirementId': requirementId,
      });

      if (!fresh) {
        throw new AppError('Requirement not found.', 404, 'REQUIREMENT_NOT_FOUND');
      }

      fresh.requirements = fresh.requirements.filter(
        (r) => r.requirementId !== requirementId
      );
      await fresh.save();
      await TestCaseSet.deleteOne({ userId, requirementId });
    } else {
      throw new AppError(
        'Failed to delete requirement.',
        500,
        'DATABASE_ERROR'
      );
    }
  } finally {
    session.endSession();
  }

  return { requirementId };
};

export default {
  listRequirements,
  getRequirementById,
  upsertRequirement,
  deleteRequirement,
  ensureUserContainer,
};
