import { z } from 'zod';
import env from '../config/env.js';

export const uuidSchema = z
  .string({ required_error: 'userId is required.' })
  .uuid({ message: 'userId must be a valid UUID.' });

export const requirementTextSchema = z
  .string({ required_error: 'requirement is required.' })
  .trim()
  .min(env.minRequirementLength, {
    message: `Requirement must be at least ${env.minRequirementLength} characters.`,
  })
  .max(env.maxRequirementLength, {
    message: `Requirement must be at most ${env.maxRequirementLength} characters.`,
  });


export const listRequirementsSchema = {
  query: z.object({
    userId: uuidSchema,
  }),
};

export const getRequirementSchema = {
  params: z.object({
    requirementId: z.string().uuid({ message: 'requirementId must be a valid UUID.' }),
  }),
  query: z.object({
    userId: uuidSchema,
  }),
};

export const deleteRequirementSchema = {
  params: z.object({
    requirementId: z.string().uuid({ message: 'requirementId must be a valid UUID.' }),
  }),
  query: z.object({
    userId: uuidSchema,
  }),
};
