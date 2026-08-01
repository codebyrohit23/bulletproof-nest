import { Global, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { AppConfigModule } from '@/config/index.js';

import { RedisHealthIndicator } from './indicators/redis-health.indicator.js';
import { RedisService } from './redis.service.js';

/**
 * Wiring only.
 *
 * `@Global()` because cache, queue, rate limiting and locks all need a client,
 * and none of them should have to import this module to get one.
 *
 * This module knows nothing about caching. `core/cache` decides TTLs, key
 * layout and tenant scoping; this decides only how to reach Redis.
 */
@Global()
@Module({
  imports: [AppConfigModule, TerminusModule],
  providers: [RedisService, RedisHealthIndicator],
  exports: [RedisService, RedisHealthIndicator],
})
export class RedisModule {}
