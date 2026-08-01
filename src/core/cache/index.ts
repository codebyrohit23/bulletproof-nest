/**
 * Cache policy.
 *
 * Owns: key layout, tenant scoping, schema versioning, TTLs and jitter,
 * serialization rules, negative caching, stampede protection, the circuit
 * breaker, and hit/miss metrics.
 *
 * Does NOT own: connections, reconnection, TLS — those are
 * `infrastructure/redis`. Nothing here knows what ioredis is.
 *
 * ---------------------------------------------------------------------------
 * HOW MODULES USE THIS
 * ---------------------------------------------------------------------------
 * Never inject `CacheService` into a feature service directly. Each module owns
 * a small cache service holding its own key builders, TTLs and schema version,
 * and exposing typed methods:
 *
 *     modules/users/cache/user-cache.service.ts
 *
 *     @Injectable()
 *     export class UserCacheService {
 *       private static readonly VERSION = 1;
 *       constructor(private readonly cache: CacheService) {}
 *
 *       private readonly keys = {
 *         profile: (userId: string) =>
 *           this.cache.globalKey({ resource: 'user', version: UserCacheService.VERSION,
 *                                  segments: [userId, 'profile'] }),
 *       };
 *
 *       rememberProfile(userId: string, loader: () => Promise<UserProfile | null>) {
 *         return this.cache.remember(this.keys.profile(userId), loader, {
 *           ttlSeconds: CACHE_TTL.FIVE_MINUTES,
 *           negativeTtlSeconds: CACHE_NEGATIVE_TTL_SECONDS,
 *         });
 *       }
 *
 *       invalidateUser(userId: string) {
 *         return this.cache.delete(this.keys.profile(userId));
 *       }
 *     }
 *
 * Why: keys stay with the domain that owns them (core must not know what a user
 * is), `cache.get<T>()` stops being an unchecked cast, and every read *and*
 * eviction for a resource sits in one file — which is what stops invalidation
 * rotting as views are added.
 *
 * The key builders are private. Callers ask for an outcome — `invalidateUser()`
 * — not a key, so the layout can change without a repo-wide grep.
 *
 * Cache in the **service** layer, never the repository: repositories stay
 * predictable and always hit the database. The loader is passed in, so a cache
 * service never depends on a repository.
 *
 * ---------------------------------------------------------------------------
 * PLANNED — deliberately not built yet
 * ---------------------------------------------------------------------------
 *   stores/memory-cache.store.ts           ONLY as an L1 tier, never a fallback
 *     Redis is always available by decision, so a memory fallback has no use.
 *     An in-process L1 in front of Redis for keys read on every single request
 *     — permissions, feature flags, org settings — is a different thing and
 *     saves a round trip. It slots in over `CacheStore` without touching
 *     `CacheService`.
 *
 *   tenant-version invalidation            WITH org plan / settings flows
 *     A counter per tenant included in the key, so bumping it orphans every
 *     entry in O(1) with no scan. Costs one extra read per lookup unless the
 *     version is memoised in-process — build both together or not at all.
 *
 *   locks/                                 → infrastructure/redis
 *     Cross-pod single-flight belongs with the connection, not with cache
 *     policy. `SingleFlight` here is in-process only, which is the cheap 90%.
 *
 * ---------------------------------------------------------------------------
 * Deliberately NOT planned
 * ---------------------------------------------------------------------------
 *   cache.interceptor.ts   An HTTP interceptor keys on the URL, and a URL does
 *                          not contain the tenant. In a multi-tenant app that
 *                          serves organization A's list to organization B.
 *                          Caching happens in services, where the tenant is in
 *                          scope.
 */

export { CacheModule } from './cache.module.js';

export { CacheService } from './cache.service.js';

export { CacheMetricsService } from './metrics/cache-metrics.service.js';

export { CACHE_NEGATIVE_TTL_SECONDS, CACHE_TTL } from './constants/cache.constants.js';

export type { CacheKeyDescriptor, CacheRememberOptions, CacheSetOptions, CacheStats } from './interfaces/index.js';
