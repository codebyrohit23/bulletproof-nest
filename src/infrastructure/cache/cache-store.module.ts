import { Module } from '@nestjs/common';

import { CacheStore } from './interfaces/index.js';
import { RedisCacheStore } from './stores/redis-cache.store.js';

/**
 * Binds the storage abstraction to a Redis implementation.
 *
 * This is the only place the two are named together. `core/cache` imports this
 * module and injects `CacheStore`; nothing above ever mentions
 * `RedisCacheStore`, so a different backend is a one-line change here.
 *
 * Not `@Global()`. `core/cache` is the single consumer and imports it
 * explicitly, which keeps the dependency visible — a global provider that only
 * one module uses hides the relationship for no benefit. `RedisService` needs
 * no import because `RedisModule` is global.
 */
@Module({
  providers: [{ provide: CacheStore, useClass: RedisCacheStore }],
  exports: [CacheStore],
})
export class CacheStoreModule {}
