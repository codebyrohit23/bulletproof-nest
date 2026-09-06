export interface RateLimitStats {
  readonly allowed: number;

  readonly denied: number;

  /**
   * Requests where the counter could not be reached, so the rule's failure
   * policy answered instead of the limit.
   *
   * Watched separately from `denied` because it means something different and
   * worse: these are requests the limit was **not applied to**. A rising count
   * is limits quietly not being enforced, however healthy `deniedRate` looks.
   */
  readonly storeErrors: number;

  readonly deniedRate: number;
}
