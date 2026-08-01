import type { ExceptionCode } from '../constants/exception.constants.js';

export interface ApiError {
  readonly code: ExceptionCode;

  readonly name?: string;

  readonly details?: unknown;

  readonly stack?: string;
}
