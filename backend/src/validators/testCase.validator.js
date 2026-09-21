import { z } from 'zod';
import {
  uuidSchema,
  requirementTextSchema,
} from './requirement.validator.js';

export const testCaseTypeEnum = z.enum(['positive', 'negative', 'validation', 'edge']);
export const testCasePriorityEnum = z.enum(['low', 'medium', 'high', 'critical']);

export const testCaseSchema = z.object({
  testCaseId: z.string().trim().min(1, 'testCaseId is required.'),
  title: z.string().trim().min(1, 'title is required.'),
  description: z.string().trim().min(1, 'description is required.'),
  type: testCaseTypeEnum,
  priority: testCasePriorityEnum,
  preconditions: z.array(z.string().trim()).default([]),
  steps: z
    .array(z.string().trim().min(1, 'steps cannot contain empty strings.'))
    .min(1, 'At least one step is required.'),
  testData: z.record(z.any()).default({}),
  expectedResult: z.string().trim().min(1, 'expectedResult is required.'),
});

export const generateTestCasesSchema = {
  body: z.object({
    userId: uuidSchema,
    requirement: requirementTextSchema,
  }),
};

export const saveTestCasesSchema = {
  body: z.object({
    userId: uuidSchema,
    requirementId: z
      .string()
      .uuid({ message: 'requirementId must be a valid UUID.' })
      .optional(),
    requirement: requirementTextSchema,
    testCases: z.array(testCaseSchema).min(1, 'At least one test case is required.'),
  }),
};

export const getTestCasesSchema = {
  params: z.object({
    requirementId: z.string().uuid({ message: 'requirementId must be a valid UUID.' }),
  }),
  query: z.object({
    userId: uuidSchema,
  }),
};

export const updateTestCasesSchema = {
  params: z.object({
    requirementId: z.string().uuid({ message: 'requirementId must be a valid UUID.' }),
  }),
  body: z.object({
    userId: uuidSchema,
    testCases: z.array(testCaseSchema).min(1, 'At least one test case is required.'),
  }),
};
