import { MIN_REQUIREMENT_LENGTH, MAX_REQUIREMENT_LENGTH } from './constants';

export function validateRequirement(text) {
  if (!text || !text.trim()) {
    return 'Requirement is required.';
  }
  const trimmed = text.trim();
  if (trimmed.length < MIN_REQUIREMENT_LENGTH) {
    return `Requirement must be at least ${MIN_REQUIREMENT_LENGTH} characters.`;
  }
  if (trimmed.length > MAX_REQUIREMENT_LENGTH) {
    return `Requirement must be at most ${MAX_REQUIREMENT_LENGTH} characters.`;
  }
  return null;
}

export function validateTestCase(tc) {
  const errors = {};
  if (!tc.title?.trim()) errors.title = 'Title is required.';
  if (!tc.description?.trim()) errors.description = 'Description is required.';
  if (!tc.expectedResult?.trim()) errors.expectedResult = 'Expected result is required.';
  if (!tc.steps || tc.steps.filter((s) => s.trim()).length === 0) {
    errors.steps = 'At least one step is required.';
  }
  return errors;
}

export function hasValidationErrors(errors) {
  return Object.keys(errors).length > 0;
}
