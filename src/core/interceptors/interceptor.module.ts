import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { ResponseInterceptor } from './response/response.interceptor.js';
import { SuccessResponseBuilder } from './response/success-response.builder.js';
import { TimeoutInterceptor } from './timeout/timeout.interceptor.js';

/**
 * Global interceptors.
 *
 * Bound through `APP_INTERCEPTOR` rather than `app.useGlobalInterceptors()` in
 * bootstrap, because these need dependency injection and `useGlobalInterceptors`
 * cannot provide it. This matches how `ExceptionModule` binds `APP_FILTER` and
 * `ValidationModule` binds `APP_PIPE` — nothing global hides in bootstrap.
 *
 * **Registration order is behaviour.** Interceptors run outside-in in the order
 * they are provided, so `TimeoutInterceptor` is first and therefore outermost:
 * the clock covers the handler *and* the envelope construction. Reversed, a
 * slow serialisation would escape the timeout.
 */
@Global()
@Module({
  providers: [
    SuccessResponseBuilder,

    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },

    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],

  exports: [SuccessResponseBuilder],
})
export class InterceptorModule {}
