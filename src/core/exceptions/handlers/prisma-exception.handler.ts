import { HttpStatus, Injectable } from '@nestjs/common';
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/client';

import { EXCEPTION_MESSAGE } from '../constants/index.js';
import type { ApiError, ExceptionDetails, ExceptionHandler } from '../interfaces/index.js';
import { ExceptionCodeMapper } from '../mappers/exception-code.mapper.js';

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
    const statusCode = this.resolveStatusCode(exception.code);

    return {
      statusCode,

      message: this.resolveMessage(exception),

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
    const statusCode = HttpStatus.BAD_REQUEST;

    return {
      statusCode,

      message: EXCEPTION_MESSAGE.BAD_REQUEST,

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
        code: ExceptionCodeMapper.map(statusCode),

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
   * Status Code Mapping
   * ------------------------------------------------------
   */

  private resolveStatusCode(code: string): HttpStatus {
    switch (code) {
      case 'P2000':
      case 'P2001':
      case 'P2005':
      case 'P2006':
      case 'P2007':
      case 'P2008':
      case 'P2009':
      case 'P2010':
      case 'P2011':
      case 'P2012':
      case 'P2013':
      case 'P2019':
        return HttpStatus.BAD_REQUEST;

      case 'P2002':
      case 'P2003':
      case 'P2014':
        return HttpStatus.CONFLICT;

      case 'P2025':
        return HttpStatus.NOT_FOUND;

      case 'P2024':
        return HttpStatus.REQUEST_TIMEOUT;

      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  /**
   * ------------------------------------------------------
   * API Error Builder
   * ------------------------------------------------------
   */

  private buildApiError(statusCode: HttpStatus, exception: Error): ApiError {
    return {
      code: ExceptionCodeMapper.map(statusCode),

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
   * Message Resolver
   * ------------------------------------------------------
   */

  private resolveMessage(exception: PrismaClientKnownRequestError): string {
    switch (exception.code) {
      case 'P2000':
        return 'Input value is too long.';

      case 'P2001':
        return 'The requested record does not exist.';

      case 'P2002':
        return 'A record with the same unique value already exists.';

      case 'P2003':
        return 'Foreign key constraint failed.';

      case 'P2004':
        return 'Database constraint failed.';

      case 'P2005':
        return 'Invalid field value.';

      case 'P2006':
        return 'Invalid data provided.';

      case 'P2007':
        return 'Data validation failed.';

      case 'P2008':
        return 'Query parsing failed.';

      case 'P2009':
        return 'Query validation failed.';

      case 'P2010':
        return 'Raw query execution failed.';

      case 'P2011':
        return 'A required field cannot be null.';

      case 'P2012':
        return 'A required value is missing.';

      case 'P2013':
        return 'Missing required argument.';

      case 'P2014':
        return 'The requested operation would violate a required relation.';

      case 'P2015':
        return 'Related record not found.';

      case 'P2016':
        return 'Query interpretation error.';

      case 'P2017':
        return 'Records are not connected.';

      case 'P2018':
        return 'Required connected records were not found.';

      case 'P2019':
        return 'Input error.';

      case 'P2020':
        return 'Value out of range.';

      case 'P2021':
        return 'Table does not exist.';

      case 'P2022':
        return 'Column does not exist.';

      case 'P2023':
        return 'Inconsistent column data.';

      case 'P2024':
        return 'Database connection timeout.';

      case 'P2025':
        return 'Requested record was not found.';

      default:
        return EXCEPTION_MESSAGE.INTERNAL_SERVER_ERROR;
    }
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
