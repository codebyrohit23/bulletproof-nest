import type { ExceptionDetails } from './exception-details.interface.js';

/**
 * Base contract for every exception handler.
 *
 * Examples:
 * - HttpExceptionHandler
 * - PrismaExceptionHandler
 * - JwtExceptionHandler
 * - ZodExceptionHandler
 * - UnknownExceptionHandler
 */
export interface ExceptionHandler {
  supports(exception: unknown): boolean;

  handle(exception: unknown): ExceptionDetails;
}
