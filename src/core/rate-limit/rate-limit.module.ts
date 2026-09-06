import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { RateLimitStoreModule } from '#/infrastructure/rate-limit/index.js';

import { RateLimitGuard } from './guards/rate-limit.guard.js';
import { RateLimitSubjectResolver } from './resolvers/rate-limit-subject.resolver.js';
import { RateLimitMetricsService } from './services/rate-limit-metrics.service.js';
import { RateLimitService } from './services/rate-limit.service.js';

/**
 * Wiring only.
 *
 * `@Global()` for the same reason `CacheModule` is: limits are needed wherever
 * abuse is possible — an auth flow, a queue producer, an HTTP guard — and none
 * of those should have to import this module to ask a question.
 *
 * `RateLimitStoreModule` is imported explicitly rather than relied on globally.
 * It is the only consumer relationship this module has, and stating it here is
 * what makes the counting implementation swappable in one visible place.
 *
 * `RateLimitGuard` is bound through `APP_GUARD` rather than
 * `app.useGlobalGuards()` in bootstrap, because it needs injection and
 * `useGlobalGuards` cannot provide it. This matches how `ExceptionModule` binds
 * `APP_FILTER` and `InterceptorModule` binds `APP_INTERCEPTOR` — nothing global
 * hides in bootstrap.
 *
 * This module decides nothing about Redis, and `infrastructure/rate-limit`
 * decides nothing about limits. The arrow runs one way — `core` depends on
 * `infrastructure`, matching every other pairing in this tree.
 */
@Global()
@Module({
  imports: [RateLimitStoreModule],
  providers: [
    RateLimitService,
    RateLimitMetricsService,
    RateLimitSubjectResolver,

    { provide: APP_GUARD, useClass: RateLimitGuard },
  ],
  exports: [RateLimitService, RateLimitMetricsService],
})
export class RateLimitModule {}
