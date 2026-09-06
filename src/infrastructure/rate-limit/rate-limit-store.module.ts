import { Module } from '@nestjs/common';

import { RateLimitStore } from './interfaces/index.js';
import { RedisFixedWindowStore } from './stores/redis-fixed-window.store.js';

/**
 * Binds the counting abstraction to a Redis implementation.
 *
 * This is the only place the two are named together. `core/rate-limit` imports
 * this module and injects `RateLimitStore`; nothing above ever mentions
 * `RedisFixedWindowStore`, so a different algorithm or a different backend is a
 * one-line change here.
 *
 * Not `@Global()`. `core/rate-limit` is the single consumer and imports it
 * explicitly, which keeps the dependency visible — a global provider that only
 * one module uses hides the relationship for no benefit. `RedisService` needs
 * no import because `RedisModule` is global.
 */
@Module({
  providers: [{ provide: RateLimitStore, useClass: RedisFixedWindowStore }],
  exports: [RateLimitStore],
})
export class RateLimitStoreModule {}
