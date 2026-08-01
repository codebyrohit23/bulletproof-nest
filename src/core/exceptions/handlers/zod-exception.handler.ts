import { HttpStatus, Injectable } from '@nestjs/common';
import { ZodError } from 'zod';
import type { $ZodIssue } from 'zod/v4/core';

import { EXCEPTION_MESSAGE } from '../constants/index.js';
import type { ApiError, ExceptionDetails, ExceptionHandler, ValidationError } from '../interfaces/index.js';
import { ExceptionCodeMapper } from '../mappers/exception-code.mapper.js';

@Injectable()
export class ZodExceptionHandler implements ExceptionHandler {
  supports(exception: unknown): boolean {
    return exception instanceof ZodError;
  }

  handle(exception: unknown): ExceptionDetails {
    const error = exception as ZodError;
    const statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
    const validationErrors = this.mapIssues(error.issues);

    return {
      statusCode,
      message: EXCEPTION_MESSAGE.UNPROCESSABLE_ENTITY,
      error: this.buildApiError(statusCode, error),
      validationErrors,
    };
  }

  /**
   * ------------------------------------------------------
   * API Error
   * ------------------------------------------------------
   * NOTE: `stack` is included here so upstream filters/interceptors
   * can strip it based on environment (NODE_ENV). This handler stays
   * environment-agnostic; redaction is a cross-cutting concern that
   * belongs to the global exception filter, not each handler.
   */
  private buildApiError(statusCode: HttpStatus, exception: ZodError): ApiError {
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

  /**
   * ------------------------------------------------------
   * Zod Issues
   * ------------------------------------------------------
   */
  private mapIssues(issues: readonly $ZodIssue[]): readonly ValidationError[] {
    return issues.map((issue) => ({
      field: this.buildFieldPath(issue),
      message: this.resolveMessage(issue),
    }));
  }

  /**
   * ------------------------------------------------------
   * Message
   * ------------------------------------------------------
   */
  private resolveMessage(issue: $ZodIssue): string {
    return issue.message;
  }

  /**
   * ------------------------------------------------------
   * Field Path
   * ------------------------------------------------------
   */
  private buildFieldPath(issue: $ZodIssue): string {
    if (issue.path.length === 0) {
      return 'body';
    }

    return issue.path
      .map((segment): string => {
        if (typeof segment === 'number') {
          return `[${segment}]`;
        }
        if (typeof segment === 'symbol') {
          return segment.description ?? segment.toString();
        }
        return segment;
      })
      .reduce<string>((path, segment) => {
        if (segment.startsWith('[')) {
          return `${path}${segment}`;
        }
        return path.length === 0 ? segment : `${path}.${segment}`;
      }, '');
  }
}
