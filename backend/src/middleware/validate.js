import AppError from '../utils/AppError.js';

/**
 * Express middleware factory that validates req.body / req.query / req.params
 * using a Zod schema object: { body?, query?, params? }
 */
const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }

    if (schema.query) {
      req.query = schema.query.parse(req.query);
    }

    if (schema.params) {
      req.params = schema.params.parse(req.params);
    }

    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const firstIssue = error.errors?.[0];
      const message = firstIssue
        ? `${firstIssue.path.join('.')}: ${firstIssue.message}`
        : 'Request validation failed.';

      const isUserIdError =
        firstIssue?.path?.includes('userId') ||
        message.toLowerCase().includes('userid');

      return next(
        new AppError(
          isUserIdError ? 'A valid anonymous userId (UUID) is required.' : message,
          400,
          isUserIdError ? 'INVALID_USER_ID' : 'VALIDATION_ERROR'
        )
      );
    }

    return next(error);
  }
};

export default validate;
