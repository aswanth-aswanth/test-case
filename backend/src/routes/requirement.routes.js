import { Router } from 'express';
import validate from '../middleware/validate.js';
import {
  listRequirementsSchema,
  getRequirementSchema,
  deleteRequirementSchema,
} from '../validators/requirement.validator.js';
import {
  getTestCasesSchema,
  updateTestCasesSchema,
} from '../validators/testCase.validator.js';
import * as requirementController from '../controllers/requirement.controller.js';
import * as testCaseController from '../controllers/testCase.controller.js';

const router = Router();

router.get(
  '/',
  validate(listRequirementsSchema),
  requirementController.listRequirements
);

router.get(
  '/:requirementId/test-cases',
  validate(getTestCasesSchema),
  testCaseController.getTestCases
);

router.put(
  '/:requirementId/test-cases',
  validate(updateTestCasesSchema),
  testCaseController.updateTestCases
);

router.get(
  '/:requirementId',
  validate(getRequirementSchema),
  requirementController.getRequirement
);

router.delete(
  '/:requirementId',
  validate(deleteRequirementSchema),
  requirementController.deleteRequirement
);

export default router;
