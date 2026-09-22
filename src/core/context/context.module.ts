import {
  Global,
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';

import { RequestContextMiddleware } from './middleware/request-context.middleware.js';
import { RequestContextService } from './services/request-context.service.js';

@Global()
@Module({
  providers: [RequestContextService],
  exports: [RequestContextService],
})
export class ContextModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
