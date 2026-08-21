/**
 * Redis connections.
 *
 * Owns: named clients, reconnection policy, TLS, lifecycle, health probe, and
 * the distributed lock primitive.
 *
 * Does NOT own: TTLs, key layout, tenant scoping, serialization, invalidation —
 * those are `core/cache` decisions. This module is the transport; nothing here
 * knows what a cache or a tenant is.
 *
 * Providers and utils are not exported: `RedisService` is the only supported
 * way to obtain a client, because a connection created elsewhere is invisible
 * to the health probe and is never closed on shutdown.
 *
 * ---------------------------------------------------------------------------
 * PLANNED — deliberately not built yet
 * ---------------------------------------------------------------------------
 *   providers/redis-cluster.provider.ts    WHEN one node stops being enough
 *     Cluster is a capacity decision, not an availability one — managed HA
 *     already covers failover behind a single URL. Beyond the constructor it
 *     also requires: `SCAN` run per node, every key of a multi-key command in
 *     one hash slot, and pipelines that do not span slots.
 *
 *   pubsub/                                WITH real-time features
 *     The `SUBSCRIBER` client exists because a subscribed connection accepts no
 *     ordinary commands, but nothing publishes yet. Build this with the first
 *     WebSocket gateway, alongside the Redis adapter for multi-pod fan-out.
 */

export { RedisModule } from './redis.module.js';

export { RedisService } from './redis.service.js';

export { RedisLockService } from './locks/redis-lock.service.js';

export { RedisHealthIndicator } from './indicators/redis-health.indicator.js';

export {
  REDIS_CLIENT,
  REDIS_HEALTH_KEY,
  type RedisClientName,
} from './constants/redis.constants.js';

export type { RedisLockHandle } from './interfaces/index.js';
