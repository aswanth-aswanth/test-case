import asyncHandler from '../utils/asyncHandler.js';
import * as requirementService from '../services/requirement.service.js';

export const listRequirements = asyncHandler(async (req, res) => {
  const { userId } = req.query;
  const data = await requirementService.listRequirements(userId);

  res.status(200).json({
    success: true,
    data,
  });
});

export const getRequirement = asyncHandler(async (req, res) => {
  const { requirementId } = req.params;
  const { userId } = req.query;
  const data = await requirementService.getRequirementById(userId, requirementId);

  res.status(200).json({
    success: true,
    data,
  });
});

export const deleteRequirement = asyncHandler(async (req, res) => {
  const { requirementId } = req.params;
  const { userId } = req.query;
  const data = await requirementService.deleteRequirement(userId, requirementId);

  res.status(200).json({
    success: true,
    data,
    message: 'Requirement and associated test cases deleted.',
  });
});
