export const RATE_LIMIT_STORE_LOG_CONTEXT = 'RateLimitStore';

/**
 * The library's own key prefix, deliberately empty.
 *
 * `rate-limiter-flexible` prepends `keyPrefix` to every key it writes, and it
 * documents `''` as the way to switch that off. It is switched off because the
 * key layout belongs to `core/rate-limit`, which builds the whole thing through
 * the namespace registry in `infrastructure/redis`. Leaving the library's
 * default in place would produce `rlflx:rl:v1:…` — a second key scheme inside
 * the one the registry exists to keep honest, and invisible to anyone reading
 * that file.
 *
 * ioredis still applies its own `keyPrefix` from configuration on top, exactly
 * as it does for cache and lock keys.
 */
export const RATE_LIMIT_STORE_KEY_PREFIX = '';

/**
 * One request spends one slot.
 *
 * The library counts in "points" so that a single call can cost more than one —
 * useful for weighting an expensive endpoint. Nothing needs that yet, and a
 * uniform cost keeps `remaining` readable as "how many more calls".
 */
export const RATE_LIMIT_POINTS_PER_HIT = 1;

/**
 * Milliseconds per second, named because the library takes `duration` in
 * seconds while every rule in this codebase is expressed in milliseconds.
 */
export const RATE_LIMIT_MS_PER_SECOND = 1_000;
