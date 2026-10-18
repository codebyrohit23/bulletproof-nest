import { Global, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { AppConfigModule } from '#/config/index.js';

import { StorageHealthIndicator } from './indicators/storage-health.indicator.js';
import { ObjectStorageService } from './object-storage.service.js';

/**
 * Wiring only.
 *
 * `@Global()` for the reason `RedisModule` is: the health check reaches every
 * indicator without importing its module, and a second copy of the service
 * would be a second client that nothing closes on shutdown.
 */
@Global()
@Module({
  imports: [AppConfigModule, TerminusModule],
  providers: [ObjectStorageService, StorageHealthIndicator],
  exports: [ObjectStorageService, StorageHealthIndicator],
})
export class StorageModule {}
