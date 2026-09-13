import { HttpStatus, Injectable } from '@nestjs/common';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/client';

import {
  EXCEPTION_MESSAGE,
  PRISMA_ERROR_RESPONSES,
  UNMAPPED_PRISMA_ERROR_RESPONSE,
} from '../constants/index.js';
import type { ApiError, ExceptionDetails, ExceptionHandler } from '../interfaces/index.js';
import { toExceptionCode } from '../mappers/exception-code.mapper.js';

@Injectable()
export class PrismaExceptionHandler implements ExceptionHandler {
  supports(exception: unknown): boolean {
    return (
      exception instanceof PrismaClientKnownRequestError ||
      exception instanceof PrismaClientValidationError ||
      exception instanceof PrismaClientInitializationError ||
      exception instanceof PrismaClientRustPanicError ||
      exception instanceof PrismaClientUnknownRequestError
    );
  }

  handle(exception: unknown): ExceptionDetails {
    if (exception instanceof PrismaClientKnownRequestError) {
      return this.handleKnownRequestError(exception);
    }

    if (exception instanceof PrismaClientValidationError) {
      return this.handleValidationError(exception);
    }

    if (exception instanceof PrismaClientInitializationError) {
      return this.handleInitializationError(exception);
    }

    if (exception instanceof PrismaClientRustPanicError) {
      return this.handleRustPanicError(exception);
    }

    if (exception instanceof PrismaClientUnknownRequestError) {
      return this.handleUnknownRequestError(exception);
    }

    return this.buildInternalServerError(exception);
  }

  /**
   * ------------------------------------------------------
   * Known Request Errors
   * ------------------------------------------------------
   */

  private handleKnownRequestError(exception: PrismaClientKnownRequestError): ExceptionDetails {
    const { statusCode, message } =
      PRISMA_ERROR_RESPONSES[exception.code] ?? UNMAPPED_PRISMA_ERROR_RESPONSE;

    return {
      statusCode,

      message,

      error: this.buildApiError(statusCode, exception),

      metadata: this.extractMetadata(exception),
    };
  }

  /**
   * ------------------------------------------------------
   * Validation Error
   * ------------------------------------------------------
   */
  private handleValidationError(exception: PrismaClientValidationError): ExceptionDetails {
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    return {
      statusCode,

      message: EXCEPTION_MESSAGE.INTERNAL_SERVER_ERROR,

      error: this.buildApiError(statusCode, exception),
    };
  }

  /**
   * ------------------------------------------------------
   * Initialization Error
   * ------------------------------------------------------
   */

  private handleInitializationError(exception: PrismaClientInitializationError): ExceptionDetails {
    const statusCode = HttpStatus.SERVICE_UNAVAILABLE;

    return {
      statusCode,

      message: EXCEPTION_MESSAGE.SERVICE_UNAVAILABLE,

      error: this.buildApiError(statusCode, exception),
    };
  }

  /**
   * ------------------------------------------------------
   * Rust Panic
   * ------------------------------------------------------
   */

  private handleRustPanicError(exception: PrismaClientRustPanicError): ExceptionDetails {
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    return {
      statusCode,

      message: EXCEPTION_MESSAGE.INTERNAL_SERVER_ERROR,

      error: this.buildApiError(statusCode, exception),
    };
  }

  /**
   * ------------------------------------------------------
   * Unknown Request Error
   * ------------------------------------------------------
   */

  private handleUnknownRequestError(exception: PrismaClientUnknownRequestError): ExceptionDetails {
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    return {
      statusCode,

      message: EXCEPTION_MESSAGE.INTERNAL_SERVER_ERROR,

      error: this.buildApiError(statusCode, exception),
    };
  }

  /**
   * ------------------------------------------------------
   * Fallback
   * ------------------------------------------------------
   */

  private buildInternalServerError(exception: unknown): ExceptionDetails {
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    return {
      statusCode,

      message: EXCEPTION_MESSAGE.INTERNAL_SERVER_ERROR,

      error: {
        code: toExceptionCode(statusCode),

        ...(exception instanceof Error && {
          name: exception.name,
        }),

        ...(exception instanceof Error &&
          exception.stack && {
            stack: exception.stack,
          }),

        ...(exception instanceof Error &&
          exception.message && {
            details: exception.message,
          }),
      },
    };
  }

  /**
   * ------------------------------------------------------
   * API Error Builder
   * ------------------------------------------------------
   */

  private buildApiError(statusCode: HttpStatus, exception: Error): ApiError {
    return {
      code: toExceptionCode(statusCode),

      ...(exception.name && {
        name: exception.name,
      }),

      ...(exception.message && {
        details: exception.message,
      }),

      ...(exception.stack && {
        stack: exception.stack,
      }),
    };
  }

  /**
   * ------------------------------------------------------
   * Metadata
   * ------------------------------------------------------
   */

  private extractMetadata(exception: PrismaClientKnownRequestError): Record<string, unknown> {
    const metadata: Record<string, unknown> = {
      prismaCode: exception.code,
    };

    if (exception.meta && typeof exception.meta === 'object') {
      Object.assign(metadata, exception.meta);
    }

    return metadata;
  }
}
