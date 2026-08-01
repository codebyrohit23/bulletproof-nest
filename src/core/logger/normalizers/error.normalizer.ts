import type { ErrorPayload } from '../interfaces/error-payload.interface.js';

/**
 * Normalizes any thrown value into a structured error payload.
 *
 * The returned object is transport-agnostic and can be safely consumed by
 * Pino, Sentry, Loki, OpenTelemetry, or any future logging backend.
 */
export function normalizeError(error: unknown): ErrorPayload {
  if (error instanceof Error) {
    const payload: ErrorPayload = {
      name: error.name,
      message: error.message,
    };

    if (error.stack) {
      payload.stack = error.stack;
    }

    const code = (error as NodeJS.ErrnoException).code;

    if (code !== undefined) {
      payload.code = code;
    }

    if (error.cause !== undefined) {
      payload.cause = error.cause;
    }

    return payload;
  }

  if (typeof error === 'object' && error !== null) {
    return {
      name: 'UnknownError',
      message: 'An unknown error occurred.',
      cause: error,
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
  };
}
