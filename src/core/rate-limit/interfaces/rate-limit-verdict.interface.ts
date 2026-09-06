/**
 * The answer a caller acts on.
 *
 * Everything an HTTP layer needs for the standard `RateLimit-Limit`,
 * `RateLimit-Remaining`, `RateLimit-Reset` and `Retry-After` headers is here,
 * so a guard never has to reach past this to compute one. A client that is told
 * only "429" retries immediately and keeps hammering; one that is told when to
 * come back can back off.
 */
export interface RateLimitVerdict {
  readonly allowed: boolean;

  readonly limit: number;

  readonly remaining: number;

  readonly resetInMs: number;

  /**
   * Rounded up, and never below one when refused.
   *
   * Rounding down would answer "try again in 0 seconds", which is an
   * instruction to retry straight into the same refusal.
   */
  readonly retryAfterSeconds: number;
}

/**
 * The result of `consumeAll` — a verdict plus which budget refused.
 *
 * `deniedBy` is `null` when every check passed. When it is set, it names the
 * check, and the verdict describes *that* budget rather than the last one
 * evaluated.
 *
 * When every check passed, the verdict describes whichever budget is closest to
 * running out — never the loosest, which would tell a caller it has fourteen
 * sends left while the budget that will actually stop it has one.
 */
export interface RateLimitOutcome extends RateLimitVerdict {
  readonly deniedBy: string | null;
}
