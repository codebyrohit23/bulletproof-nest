/**
 * What `/health/live` returns.
 *
 * Deliberately not Terminus's `HealthCheckResult` — that shape describes a set
 * of dependency checks, and liveness performs none. Reusing it would imply this
 * endpoint verifies something it does not.
 */
export interface LivenessResult {
  readonly status: 'ok';

  /**
   * Seconds since the process started.
   *
   * The useful field in practice: a value that keeps resetting is a container
   * in a crash loop, which is otherwise easy to miss when every individual
   * probe returns `ok`.
   */
  readonly uptimeSeconds: number;

  readonly timestamp: string;
}
