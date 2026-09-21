const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Bounded exponential backoff with jitter.
 * delay = baseDelay * 2^attempt + randomJitter
 */
export const computeBackoffDelay = (attempt, baseDelayMs = 500, maxDelayMs = 8000) => {
  const exponential = baseDelayMs * 2 ** attempt;
  const jitter = Math.floor(Math.random() * 250);
  return Math.min(exponential + jitter, maxDelayMs);
};

/**
 * Retry a function up to maxRetries times on retryable failures.
 * maxRetries = number of retries AFTER the first attempt.
 * Total attempts = maxRetries + 1.
 */
export const withRetry = async (fn, options = {}) => {
  const {
    maxRetries = 2,
    baseDelayMs = 500,
    maxDelayMs = 8000,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === maxRetries;
      if (isLastAttempt || !shouldRetry(error, attempt)) {
        throw error;
      }

      const delay = computeBackoffDelay(attempt, baseDelayMs, maxDelayMs);

      if (typeof onRetry === 'function') {
        onRetry({ attempt: attempt + 1, delay, error });
      }

      await sleep(delay);
    }
  }

  throw lastError;
};

export default withRetry;
