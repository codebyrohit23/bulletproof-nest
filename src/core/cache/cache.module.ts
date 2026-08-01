import { Global, Module } from '@nestjs/common';

import { CacheService } from './cache.service.js';
import { CacheMetricsService } from './metrics/cache-metrics.service.js';
import { RedisCacheStore } from './stores/redis-cache.store.js';

/**
 * Cache policy — TTLs, key layout, tenant scoping, serialization, resilience.
 *
 * `@Global()` because every module's own cache service injects `CacheService`,
 * and none of them should have to import this to get it.
 *
 * `RedisModule` is not imported: it is itself `@Global()`, and this module
 * depends on the connection, not on how it is obtained.
 */
@Global()
@Module({
  providers: [CacheService, CacheMetricsService, RedisCacheStore],
  exports: [CacheService, CacheMetricsService],
})
export class CacheModule {}
