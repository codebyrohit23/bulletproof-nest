import { Injectable } from '@nestjs/common';

import type { ResponseMeta } from '@/shared/response/index.js';

import { DEFAULT_SUCCESS_MESSAGE, FALLBACK_SUCCESS_MESSAGE } from './response.constants.js';
import type { SuccessResponseBuilderOptions } from './success-response-builder-options.interface.js';
import type { SuccessResponse } from './success-response.interface.js';

/**
 * Assembles the success envelope.
 *
 * The counterpart to `ErrorResponseBuilder`. Kept as a separate injectable
 * rather than inlined in the interceptor so the envelope can be produced
 * outside the HTTP pipeline too — a webhook replay, a batch endpoint, a
 * contract test — without going through an interceptor.
 *
 * Field order here must match `ErrorResponseBuilder` exactly.
 */
@Injectable()
export class SuccessResponseBuilder {
  build<T>(options: SuccessResponseBuilderOptions<T>): SuccessResponse<T> {
    const { data, statusCode, path, message, requestId } = options;

    return {
      success: true,

      statusCode,

      message: message ?? this.resolveDefaultMessage(statusCode),

      data,

      meta: this.buildMeta(path, requestId),
    };
  }

  private buildMeta(path: string, requestId: string | undefined): ResponseMeta {
    return {
      timestamp: new Date().toISOString(),

      path,

      ...(requestId !== undefined ? { requestId } : {}),
    };
  }

  private resolveDefaultMessage(statusCode: number): string {
    return DEFAULT_SUCCESS_MESSAGE[statusCode] ?? FALLBACK_SUCCESS_MESSAGE;
  }
}
