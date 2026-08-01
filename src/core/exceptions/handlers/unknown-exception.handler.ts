import { HttpStatus, Injectable } from '@nestjs/common';

import { EXCEPTION_MESSAGE } from '../constants/exception.constants.js';
import type { ApiError } from '../interfaces/api-error.interface.js';
import type { ExceptionDetails } from '../interfaces/exception-details.interface.js';
import type { ExceptionHandler } from '../interfaces/exception-handler.interface.js';
import { ExceptionCodeMapper } from '../mappers/exception-code.mapper.js';

@Injectable()
export class UnknownExceptionHandler implements ExceptionHandler {
  supports(_exception: unknown): boolean {
    return true;
  }

  handle(exception: unknown): ExceptionDetails {
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    return {
      statusCode,

      message: EXCEPTION_MESSAGE.INTERNAL_SERVER_ERROR,

      error: this.buildApiError(statusCode, exception),
    };
  }

  private buildApiError(statusCode: HttpStatus, exception: unknown): ApiError {
    if (exception instanceof Error) {
      return {
        code: ExceptionCodeMapper.map(statusCode),

        name: exception.name,

        ...(exception.message && {
          details: exception.message,
        }),

        ...(exception.stack && {
          stack: exception.stack,
        }),
      };
    }

    return {
      code: ExceptionCodeMapper.map(statusCode),

      ...(exception !== undefined && {
        details: exception,
      }),
    };
  }
}
