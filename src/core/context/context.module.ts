import { Global, type MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';

import { RequestContextMiddleware } from './middleware/request-context.middleware.js';
import { RequestContextService } from './services/request-context.service.js';

/**
 * Ambient identity for the current unit of work.
 *
 * `@Global()` because nearly everything reads it — the logger, the response
 * envelope, the exception filter, repositories — and none of them should have
 * to import this module to do so.
 *
 * The middleware is applied to every route here rather than in `bootstrap/`
 * so the module stays self-contained: adding this one module to `AppModule` is
 * all that is required for context to work.
 */
@Global()
@Module({
  providers: [RequestContextService],
  exports: [RequestContextService],
})
export class ContextModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    /*
     * `{*path}` is path-to-regexp v8's "zero or more segments", so this also
     * covers the root path — `*path` requires at least one.
     *
     * Note this does *not* silence the `Unsupported route path: "/api/*"`
     * warning at boot. That path is generated inside Nest: with a global prefix
     * set, `RouteInfoPathExtractor` expands any wildcard middleware into a bare
     * `/api/*` entry, and Nest's own `LegacyRouteConverter` then warns about it
     * and rewrites it to `/api/{*path}`. It is Nest warning about a string Nest
     * produced, and it cannot be avoided from here — only by not registering
     * this as Nest middleware at all.
     */
    consumer.apply(RequestContextMiddleware).forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
