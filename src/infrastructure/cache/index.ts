/**
 * Cache storage.
 *
 * Owns: the read and write mechanics — pipelines, `SCAN`, `UNLINK`, and the
 * translation of one client's conventions into plain strings.
 *
 * Does NOT own: key layout, TTLs and jitter, tenant scoping, serialization,
 * negative caching, stampede protection, the circuit breaker, or hit/miss
 * metrics. Those are `core/cache` decisions. Nothing here knows what a
 * workspace, a resource or an envelope is.
 *
 * `RedisCacheStore` is deliberately not exported — `CacheStore` is the only
 * supported way in, and `CacheStoreModule` is what supplies it. Injecting the
 * concrete class would couple the policy layer to Redis, which is precisely
 * what this folder was extracted to stop.
 *
 * ---------------------------------------------------------------------------
 * PLANNED — deliberately not built yet
 * ---------------------------------------------------------------------------
 *   stores/memory-cache.store.ts           ONLY as an L1 tier, never a fallback
 *     Redis is always available by decision, so a memory *fallback* has no use
 *     — it would serve one pod's stale view while the others moved on. An
 *     in-process L1 in front of Redis for keys read on every single request
 *     (permissions, feature flags, org settings) is a different thing and saves
 *     a round trip. It slots in over `CacheStore` without touching
 *     `CacheService`, which is the whole point of the seam.
 */

export { CacheStoreModule } from './cache-store.module.js';

export { CacheStore } from './interfaces/index.js';

export type { CacheStoreEntry } from './interfaces/index.js';
