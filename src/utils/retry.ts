import { delay } from "./delay.ts";

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  onRetry?: (attempt: number, error: unknown) => void;
  getDelayMs?: (attempt: number, error: unknown) => number;
}

/**
 * Retries `fn` up to `maxRetries` times with exponential backoff.
 * Re-throws the last error as-is so callers can wrap it with context.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const { maxRetries, baseDelayMs, onRetry, getDelayMs } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      onRetry?.(attempt, error);

      if (attempt < maxRetries) {
        const waitMs = getDelayMs
          ? getDelayMs(attempt, error)
          : baseDelayMs * Math.pow(2, attempt - 1);
        await delay(waitMs);
      }
    }
  }

  // Re-throw the original error so callers can wrap it with their own context
  throw lastError;
}