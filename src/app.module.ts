import { Module } from '@nestjs/common';

import { AppConfigModule } from '#/config/index.js';
import { CacheModule } from '#/core/cache/index.js';
import { ContextModule } from '#/core/context/index.js';
import { ExceptionModule } from '#/core/exceptions/index.js';
import { InterceptorModule } from '#/core/interceptors/index.js';
import { AppLoggerModule } from '#/core/logger/index.js';
import { SecurityModule } from '#/core/security/index.js';
import { ValidationModule } from '#/core/validation/index.js';
import { PrismaModule } from '#/infrastructure/database/prisma/index.js';
import { QueueModule, QueueWorkerModule } from '#/infrastructure/queue/index.js';
import { RedisModule } from '#/infrastructure/redis/index.js';
import { HealthModule } from '#/modules/health/index.js';

/**
 * Every module is imported explicitly, in dependency order, even the ones marked
 * `@Global()`. Relying on a global module being pulled in transitively by
 * something else works until that import is removed, and then fails at boot in
 * a place unrelated to the change.
 *
 * `ContextModule` is listed first because it registers the middleware that
 * establishes the request context, and Nest applies middleware in module import
 * order — anything registered before it would run without a `requestId`.
 */
@Module({
  imports: [
    AppConfigModule,
    ContextModule,
    AppLoggerModule,
    PrismaModule,
    RedisModule,
    CacheModule,
    QueueModule,
    QueueWorkerModule,
    ExceptionModule,
    InterceptorModule,
    ValidationModule,
    SecurityModule,

    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
