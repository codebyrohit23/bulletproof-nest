import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppConfigService, appConfig } from './app/index.js';
import { DatabaseConfigService, databaseConfig } from './database/index.js';
import { SecurityConfigService, securityConfig } from './security/index.js';

/**
 * Every config namespace must be registered here.
 *
 * A loader that is written but not listed in `load` makes its config service
 * throw on first resolution — the namespace simply does not exist.
 *
 * `@Global()` mirrors the `isGlobal: true` already declared below: without it
 * `ConfigService` is visible everywhere but the typed wrappers around it are
 * not, so any module injecting one has to import this module by hand.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [appConfig, databaseConfig, securityConfig],
    }),
  ],
  providers: [AppConfigService, DatabaseConfigService, SecurityConfigService],
  exports: [AppConfigService, DatabaseConfigService, SecurityConfigService],
})
export class AppConfigModule {}
