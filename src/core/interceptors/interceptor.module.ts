import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ZodSerializerInterceptor } from 'nestjs-zod';

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
 * **Registration order is behaviour**, and it reads in opposite directions for
 * the two halves of a request:
 *
 * - On the way *in*, interceptors run outside-in in the order provided.
 *   `TimeoutInterceptor` is first and therefore outermost, so the clock covers
 *   the handler *and* the envelope construction. Reversed, a slow serialisation
 *   would escape the timeout.
 * - On the way *out*, the innermost runs first — so the order below is reversed
 *   for response mapping. `ZodSerializerInterceptor` is provided last precisely
 *   because it must run first on the way out: it parses the handler's raw
 *   return value against the response DTO. Provided any earlier it would be
 *   handed the finished envelope instead, and every documented endpoint would
 *   fail serialisation against a schema describing only `data`.
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

    /**
     * Strips every field the response DTO does not name.
     *
     * Attached per handler by `ApiSuccessResponse`, which applies the
     * `ZodSerializerDto` metadata this reads — so a documented endpoint is an
     * enforced endpoint, and there is no way to document one shape while
     * returning another. A handler with no response DTO passes through
     * untouched, which is what keeps this safe to apply globally.
     */
    {
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
  ],

  exports: [SuccessResponseBuilder],
})
export class InterceptorModule {}
