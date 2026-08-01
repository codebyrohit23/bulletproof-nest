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
