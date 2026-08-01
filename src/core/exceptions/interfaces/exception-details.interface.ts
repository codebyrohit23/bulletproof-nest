import type { ApiError } from './api-error.interface.js';
import type { ValidationError } from './validation-error.interface.js';

export interface ExceptionDetails {
  statusCode: number;

  message: string;

  error: ApiError;

  validationErrors?: readonly ValidationError[];

  cause?: unknown;

  metadata?: Record<string, unknown>;
}
