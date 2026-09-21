const ERROR_MESSAGES = {
  AI_RATE_LIMITED:
    'The AI service is temporarily busy. Please wait a moment and try again.',
  AI_TIMEOUT:
    'The AI request took too long. Please try again.',
  AI_INVALID_OUTPUT:
    'The AI returned an unexpected result. Please try generating again.',
  AI_UNAVAILABLE:
    'The AI service is temporarily unavailable. Please try again shortly.',
  AI_CONFIGURATION_ERROR:
    'The AI service is misconfigured. Please contact support.',
  VALIDATION_ERROR:
    'Please check the information you entered.',
  REQUIREMENT_NOT_FOUND:
    'This requirement could not be found.',
  TEST_CASES_NOT_FOUND:
    'No saved test cases were found for this requirement.',
  DATABASE_ERROR:
    "We couldn't complete the request. Please try again.",
  INTERNAL_SERVER_ERROR:
    'Something went wrong. Please try again.',
  NETWORK_ERROR:
    'Unable to connect to the server. Please check your connection and try again.',
  SERVER_UNAVAILABLE:
    'The server is currently unavailable. Please try again shortly.',
};

const DEFAULT_ERROR = 'Something went wrong. Please try again.';

/**
 * Normalize any error (Axios, network, backend) into a frontend-friendly shape:
 * { code, message }
 */
export function normalizeError(error) {
  // Network / no response
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return {
        code: 'AI_TIMEOUT',
        message: ERROR_MESSAGES.AI_TIMEOUT,
      };
    }
    return {
      code: 'NETWORK_ERROR',
      message: ERROR_MESSAGES.NETWORK_ERROR,
    };
  }

  const { status, data } = error.response;

  // Backend returned { success: false, error: { code, message } }
  if (data?.error?.code) {
    const code = data.error.code;
    return {
      code,
      message: ERROR_MESSAGES[code] || data.error.message || DEFAULT_ERROR,
    };
  }

  // HTTP status fallbacks
  if (status === 429) {
    return { code: 'AI_RATE_LIMITED', message: ERROR_MESSAGES.AI_RATE_LIMITED };
  }
  if (status === 503 || status === 502) {
    return { code: 'SERVER_UNAVAILABLE', message: ERROR_MESSAGES.SERVER_UNAVAILABLE };
  }
  if (status === 500) {
    return { code: 'INTERNAL_SERVER_ERROR', message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR };
  }
  if (status === 404) {
    return { code: 'REQUIREMENT_NOT_FOUND', message: ERROR_MESSAGES.REQUIREMENT_NOT_FOUND };
  }
  if (status === 400) {
    return {
      code: 'VALIDATION_ERROR',
      message: data?.message || ERROR_MESSAGES.VALIDATION_ERROR,
    };
  }

  return { code: 'UNKNOWN_ERROR', message: DEFAULT_ERROR };
}

/**
 * Get a user-friendly string from a normalized error or raw value.
 */
export function getErrorMessage(error) {
  if (!error) return null;
  if (typeof error === 'string') return error;
  return error.message || DEFAULT_ERROR;
}
