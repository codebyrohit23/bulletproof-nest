import { Global, Module } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

import { ZodValidationPipe } from './pipes/zod-validation.pipe.js';

/**
 * Global request validation.
 *
 * Bound through `APP_PIPE` rather than `app.useGlobalPipes()` in bootstrap, so
 * the pipe participates in dependency injection. It has no dependencies today,
 * but a locale-aware error map will need `RequestContextService`, and starting
 * here avoids migrating later.
 *
 * It also keeps one rule intact: everything applied globally is registered in a
 * module. `ExceptionModule` binds `APP_FILTER`, `InterceptorModule` binds
 * `APP_INTERCEPTOR`, this binds `APP_PIPE`. Nothing global hides in bootstrap.
 */
@Global()
@Module({
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
  ],
})
export class ValidationModule {}
