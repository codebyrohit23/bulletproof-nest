/**
 * Rate-limit counting.
 *
 * Owns: the counting algorithm, the atomic increment-and-expire, and the
 * translation of one library's conventions into a plain result.
 *
 * Does NOT own: key layout, limits, tenant scoping, what to do when the store
 * is down, or which subject a limit applies to. Those are `core/rate-limit`
 * decisions. Nothing here knows what an identifier, a workspace or an OTP is.
 *
 * `RedisFixedWindowStore` is deliberately not exported — `RateLimitStore` is
 * the only supported way in, and `RateLimitStoreModule` is what supplies it.
 * Injecting the concrete class would couple a policy layer to Redis.
 * `infrastructure/cache` is arranged the same way, for the same reason.
 *
 * ---------------------------------------------------------------------------
 * PLANNED — deliberately not built yet
 * ---------------------------------------------------------------------------
 *   stores/redis-sliding-window.store.ts   WHEN a fixed window's boundary bites
 *     A sorted set of timestamps, trimmed to `now - windowMs` on every call, so
 *     the count is genuinely "the last N minutes" rather than "this bucket".
 *     Costs a ZSET per key instead of an integer; worth it only where the
 *     `2 × limit` seam of a fixed window actually matters.
 *
 *   stores/redis-token-bucket.store.ts     WHEN bursts should be allowed
 *     For public API quotas, where a client that has been idle should be able
 *     to spend a burst rather than being held to a flat rate.
 *
 *   stores/memory.store.ts                 FOR tests and local development
 *     Same contract, a Map, no Redis. Cheap because the seam already exists.
 */

export { RateLimitStoreModule } from './rate-limit-store.module.js';

export { RateLimitStore } from './interfaces/index.js';

export type { RateLimitWindow } from './interfaces/index.js';
