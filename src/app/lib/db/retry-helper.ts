// lib/db/retry-helper.ts
/**
 * Retry helper for database operations with exponential backoff
 * Handles transient database errors gracefully
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNRESET',
    'Connection',
    'timeout',
    'temporarily unavailable',
    'deadlock',
    'lock',
  ],
};

/**
 * Checks if an error is retryable based on error message
 */
function isRetryableError(error: unknown, retryableErrors: string[]): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorString = errorMessage.toLowerCase();
  
  return retryableErrors.some(retryableError => 
    errorString.includes(retryableError.toLowerCase())
  );
}

/**
 * Calculates delay for exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Retries a database operation with exponential backoff
 * 
 * @param operation - The async operation to retry
 * @param options - Retry configuration options
 * @returns The result of the operation
 * @throws The last error if all retries fail
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (!isRetryableError(error, config.retryableErrors)) {
        // Not a retryable error, throw immediately
        throw error;
      }

      // If this is the last attempt, throw the error
      if (attempt >= config.maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffMultiplier
      );

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay; // Up to 30% jitter
      const finalDelay = delay + jitter;

      console.warn(
        `⚠️ Database operation failed (attempt ${attempt}/${config.maxRetries}), retrying in ${Math.round(finalDelay)}ms...`,
        error instanceof Error ? error.message : String(error)
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }

  // All retries exhausted
  console.error(
    `❌ Database operation failed after ${config.maxRetries} attempts:`,
    lastError instanceof Error ? lastError.message : String(lastError)
  );
  throw lastError;
}

/**
 * Retries a database operation with custom retry logic
 * Useful for operations that need specific retry conditions
 */
export async function retryWithCustomLogic<T>(
  operation: () => Promise<T>,
  shouldRetry: (error: unknown, attempt: number) => boolean,
  options: Omit<RetryOptions, 'retryableErrors'> = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if we should retry using custom logic
      if (!shouldRetry(error, attempt)) {
        throw error;
      }

      // If this is the last attempt, throw the error
      if (attempt >= config.maxRetries) {
        break;
      }

      // Calculate delay
      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffMultiplier
      );

      const jitter = Math.random() * 0.3 * delay;
      const finalDelay = delay + jitter;

      console.warn(
        `⚠️ Operation failed (attempt ${attempt}/${config.maxRetries}), retrying in ${Math.round(finalDelay)}ms...`
      );

      await new Promise(resolve => setTimeout(resolve, finalDelay));
    }
  }

  throw lastError;
}

