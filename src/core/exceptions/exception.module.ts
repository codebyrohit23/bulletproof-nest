import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';

import { AppLoggerModule } from '@/core/logger/index.js';

import { ErrorResponseBuilder } from './builders/error-response.builder.js';
import { EXCEPTION_HANDLERS } from './constants/index.js';
import { ExceptionMapperService } from './exception-mapper.service.js';
import { GlobalExceptionFilter } from './filters/global-exception.filter.js';
import { HttpExceptionHandler } from './handlers/http-exception.handler.js';
import { PrismaExceptionHandler } from './handlers/prisma-exception.handler.js';
import { UnknownExceptionHandler } from './handlers/unknown-exception.handler.js';
import { ZodExceptionHandler } from './handlers/zod-exception.handler.js';
import type { ExceptionHandler } from './interfaces/index.js';

@Global()
@Module({
  imports: [AppLoggerModule],

  providers: [
    ErrorResponseBuilder,

    ExceptionMapperService,

    HttpExceptionHandler,
    PrismaExceptionHandler,
    ZodExceptionHandler,
    UnknownExceptionHandler,

    {
      provide: EXCEPTION_HANDLERS,
      useFactory: (
        httpExceptionHandler: HttpExceptionHandler,
        prismaExceptionHandler: PrismaExceptionHandler,
        zodExceptionHandler: ZodExceptionHandler,
        unknownExceptionHandler: UnknownExceptionHandler,
      ): readonly ExceptionHandler[] => [
        zodExceptionHandler,
        prismaExceptionHandler,
        httpExceptionHandler,
        unknownExceptionHandler,
      ],
      inject: [HttpExceptionHandler, PrismaExceptionHandler, ZodExceptionHandler, UnknownExceptionHandler],
    },

    GlobalExceptionFilter,

    {
      provide: APP_FILTER,
      useExisting: GlobalExceptionFilter,
    },
  ],

  exports: [ErrorResponseBuilder, ExceptionMapperService],
})
export class ExceptionModule {}
