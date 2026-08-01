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
    consumer.apply(RequestContextMiddleware).forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
