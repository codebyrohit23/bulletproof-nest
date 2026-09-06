import { Global, Module } from '@nestjs/common';

import { CacheStoreModule } from '#/infrastructure/cache/index.js';

import { CacheService } from './cache.service.js';
import { CacheMetricsService } from './metrics/cache-metrics.service.js';

@Global()
@Module({
  imports: [CacheStoreModule],
  providers: [CacheService, CacheMetricsService],
  exports: [CacheService, CacheMetricsService],
})
export class CacheModule {}
