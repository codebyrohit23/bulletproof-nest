import { HttpException, Injectable } from '@nestjs/common';

import { EXCEPTION_MESSAGE } from '../constants/exception.constants.js';
import type { ExceptionDetails } from '../interfaces/exception-details.interface.js';
import type { ExceptionHandler } from '../interfaces/exception-handler.interface.js';
import type { ValidationError } from '../interfaces/validation-error.interface.js';
import { ExceptionCodeMapper } from '../mappers/exception-code.mapper.js';

@Injectable()
export class HttpExceptionHandler implements ExceptionHandler {
  supports(exception: unknown): boolean {
    return exception instanceof HttpException;
  }

  handle(exception: unknown): ExceptionDetails {
    const httpException = exception as HttpException;

    const statusCode = httpException.getStatus();

    const response: unknown = httpException.getResponse();

    const validationErrors = this.extractValidationErrors(response);

    return {
      statusCode,

      message: this.extractMessage(response),

      error: {
        code: ExceptionCodeMapper.map(statusCode),

        ...(httpException.name && {
          name: httpException.name,
        }),

        ...(response !== undefined && {
          details: response,
        }),

        ...(httpException.stack && {
          stack: httpException.stack,
        }),
      },

      ...(validationErrors.length > 0 && {
        validationErrors,
      }),
    };
  }

  /**
   * -----------------------------------------
   * Extract message
   * -----------------------------------------
   */

  private extractMessage(response: unknown): string {
    if (typeof response === 'string') {
      return response;
    }

    if (!this.isObject(response)) {
      return EXCEPTION_MESSAGE.INTERNAL_SERVER_ERROR;
    }

    const value = response.message;

    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
      return value[0];
    }

    return EXCEPTION_MESSAGE.INTERNAL_SERVER_ERROR;
  }

  /**
   * -----------------------------------------
   * Validation errors
   * -----------------------------------------
   */

  private extractValidationErrors(response: unknown): readonly ValidationError[] {
    if (!this.isObject(response)) {
      return [];
    }

    const value = response.message;

    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item): item is string => typeof item === 'string')
      .map((message) => ({
        field: 'body',

        message,
      }));
  }

  /**
   * -----------------------------------------
   * Error Code Mapping
   * -----------------------------------------
   */

  /**
   * -----------------------------------------
   * Type Guard
   * -----------------------------------------
   */

  private isObject(value: unknown): value is {
    message?: unknown;
  } {
    return typeof value === 'object' && value !== null;
  }
}
