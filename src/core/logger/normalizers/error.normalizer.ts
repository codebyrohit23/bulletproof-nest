import type { ErrorPayload } from '../interfaces/error-payload.interface.js';

/**
 * Turns a thrown value that is *not* an `Error` into pino's error shape.
 *
 * Real `Error` instances are left to pino's own serializer, which handles
 * aggregate errors and cause chains properly; this covers what that serializer
 * passes straight through — a thrown string, a rejected plain object, an
 * `undefined` from a badly written library.
 *
 * The result deliberately carries no `stack`. Without one it is not
 * "error-like" to pino, so it reaches the output untouched rather than being
 * re-serialized into `type: "Object"`.
 */
export function normalizeError(error: unknown): ErrorPayload {
  if (error instanceof Error) {
    const payload: ErrorPayload = {
      type: error.name,
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
      type: 'UnknownError',
      message: 'An unknown error occurred.',
      cause: error,
    };
  }

  return {
    type: 'UnknownError',
    message: String(error),
  };
}
