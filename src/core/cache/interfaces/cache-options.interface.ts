export interface CacheSetOptions {
  readonly ttlSeconds: number;
}

export interface CacheRememberOptions extends CacheSetOptions {
  /**
   * How long to remember that the loader returned nothing.
   *
   * Omitted means misses are not cached, which leaves a repeated lookup of a
   * non-existent id hitting the database every time — cheap to trigger when the
   * id comes from a URL. A few seconds is usually the right answer; see
   * `CACHE_NEGATIVE_TTL_SECONDS`.
   */
  readonly negativeTtlSeconds?: number;

  /**
   * Take a cross-pod lock so only one replica runs the loader.
   *
   * Off by default. In-process single-flight already collapses concurrent
   * callers within a replica, so this buys the difference between one load per
   * pod and one load overall — worth two extra Redis round trips for an
   * aggregation, a report or an external API call, and not worth it for a
   * single indexed lookup.
   *
   * Best-effort: a replica that cannot take the lock waits briefly, re-checks
   * the cache, and eventually loads anyway. It reduces duplicate work; it does
   * not guarantee exactly one execution.
   */
  readonly lock?: boolean;
}

/**
 * Counters exposed for `/metrics` once observability lands.
 *
 * Without these you cannot answer whether a cache is earning its complexity,
 * and roughly half the time the honest answer is no.
 */
export interface CacheStats {
  readonly hits: number;

  readonly misses: number;

  readonly errors: number;

  /** Reads short-circuited because the circuit was open. */
  readonly skipped: number;

  readonly hitRate: number;
}
