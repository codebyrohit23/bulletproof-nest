export interface CacheSetOptions {
  readonly ttlSeconds: number;
}

export interface CacheRememberOptions extends CacheSetOptions {
  readonly negativeTtlSeconds?: number;

  readonly lock?: boolean;
}

export interface CacheStats {
  readonly hits: number;

  readonly misses: number;

  readonly errors: number;

  readonly skipped: number;

  readonly hitRate: number;
}
