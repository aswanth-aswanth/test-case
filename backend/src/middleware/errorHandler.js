import AppError from '../utils/AppError.js';
import env from '../config/env.js';

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred.';

  if (err.name === 'ZodError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.errors?.[0]?.message || 'Request validation failed.';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(', ') || 'Database validation failed.';
  }

  if (err.code === 11000) {
    statusCode = 409;
    code = 'VALIDATION_ERROR';
    message = 'A duplicate resource already exists.';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Invalid identifier format.';
  }

  if (!(err instanceof AppError) && statusCode === 500) {
    console.error('Unhandled error:', {
      name: err.name,
      message: err.message,
      stack: env.isProduction ? undefined : err.stack,
    });
  } else if (statusCode >= 500) {
    console.error('Server error:', { code, message });
  }

  const payload = {
    success: false,
    error: {
      code,
      message:
        statusCode === 500 && env.isProduction && !(err instanceof AppError)
          ? 'An unexpected error occurred.'
          : message,
    },
  };

  if (err.details && !env.isProduction) {
    payload.error.details = err.details;
  }

  res.status(statusCode).json(payload);
};

export default errorHandler;
