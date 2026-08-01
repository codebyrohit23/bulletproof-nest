/**
 * Retry helpers. Pure — no Prisma, no DI, no logging.
 */

export interface BackoffPolicy {
  readonly attempts: number;

  readonly baseDelayMs: number;

  readonly maxDelayMs: number;

  /**
   * Fraction of the computed delay applied as random jitter, `0`–`1`.
   *
   * Without jitter every replica retries on the same schedule and stampedes a
   * database that is still coming back up.
   */
  readonly jitterRatio: number;
}

/**
 * Exponential backoff with full-width jitter, clamped to `maxDelayMs`.
 *
 * `attempt` is 1-based: the delay *after* the first failure is `baseDelayMs`.
 */
export function calculateBackoffDelay(attempt: number, policy: BackoffPolicy): number {
  const exponential = policy.baseDelayMs * 2 ** Math.max(0, attempt - 1);
  const clamped = Math.min(exponential, policy.maxDelayMs);
  const jitter = clamped * policy.jitterRatio * (Math.random() * 2 - 1);

  return Math.max(0, Math.round(clamped + jitter));
}

export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

/**
 * Runs `operation`, retrying on failure until the attempt budget is spent.
 *
 * `onRetry` is called before each wait so the caller can log the attempt
 * without this helper needing to know what a logger is. The last error is
 * rethrown once the budget runs out.
 */
export async function retryAsync<T>(
  operation: () => Promise<T>,
  policy: BackoffPolicy,
  onRetry?: (attempt: number, delayMs: number, error: unknown) => void,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= policy.attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt >= policy.attempts) {
        break;
      }

      const delayMs = calculateBackoffDelay(attempt, policy);

      onRetry?.(attempt, delayMs, error);

      await sleep(delayMs);
    }
  }

  throw lastError;
}
