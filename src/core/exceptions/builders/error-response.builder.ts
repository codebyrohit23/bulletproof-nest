import { Injectable } from '@nestjs/common';

import { AppConfigService } from '#/config/app/index.js';
import { RequestContextService } from '#/core/context/index.js'; // value import — required for DI metadata
import type { ResponseMeta } from '#/shared/response/index.js';

import type { ApiError } from '../interfaces/api-error.interface.js';
import type { ErrorResponseBuilderOptions } from '../interfaces/error-response-builder-options.interface.js';
import type { ErrorResponse } from '../interfaces/error-response.interface.js';

@Injectable()
export class ErrorResponseBuilder {
  constructor(
    private readonly appConfigService: AppConfigService,

    private readonly requestContext: RequestContextService,
  ) {}

  /**
   * Builds the final API error response.
   */
  build(options: ErrorResponseBuilderOptions): ErrorResponse {
    const { path, exception } = options;

    return {
      success: false,

      statusCode: exception.statusCode,

      message: exception.message,

      error: this.buildError(exception.error),

      ...(exception.validationErrors
        ? {
            validationErrors: exception.validationErrors,
          }
        : {}),

      meta: this.buildMeta(path),
    };
  }

  /**
   * Identical in shape to `SuccessResponseBuilder.buildMeta` — a client reads
   * `meta.requestId` the same way whether the request succeeded or failed.
   */
  private buildMeta(path: string): ResponseMeta {
    const { requestId } = this.requestContext;

    return {
      timestamp: new Date().toISOString(),

      path,

      ...(requestId !== undefined ? { requestId } : {}),
    };
  }

  /**
   * Removes sensitive information
   * in production.
   */
  private buildError(error: ApiError): ApiError {
    if (this.appConfigService.isProduction) {
      return {
        code: error.code,
      };
    }

    return {
      code: error.code,

      ...(error.name && {
        name: error.name,
      }),

      ...(error.details !== undefined && {
        details: error.details,
      }),

      ...(error.stack && {
        stack: error.stack,
      }),
    };
  }
}
