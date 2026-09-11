import { Module } from '@nestjs/common';

import { CacheStore } from './interfaces/index.js';
import { RedisCacheStore } from './stores/redis-cache.store.js';

@Module({
  providers: [{ provide: CacheStore, useClass: RedisCacheStore }],
  exports: [CacheStore],
})
export class CacheStoreModule {}
