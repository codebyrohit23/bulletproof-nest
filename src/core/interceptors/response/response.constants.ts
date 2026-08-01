import { HttpStatus } from '@nestjs/common';

/**
 * Metadata keys. Namespaced so they cannot collide with keys set by Nest or by
 * a third-party decorator.
 */
export const RESPONSE_MESSAGE_KEY = 'leadflow:response-message';

export const RAW_RESPONSE_KEY = 'leadflow:raw-response';

/**
 * Used when a handler does not declare its own message with
 * `@ResponseMessage()`. Keyed by status so a POST reads "created" rather than
 * a generic success string.
 */
export const DEFAULT_SUCCESS_MESSAGE: Readonly<Record<number, string>> = {
  [HttpStatus.OK]: 'Request completed successfully.',
  [HttpStatus.CREATED]: 'Resource created successfully.',
  [HttpStatus.ACCEPTED]: 'Request accepted for processing.',
};

export const FALLBACK_SUCCESS_MESSAGE = 'Request completed successfully.';

/**
 * `HttpStatus.NO_CONTENT` widened to `number`.
 *
 * `FastifyReply.statusCode` is a plain number, and comparing it against the
 * enum member is flagged as an unsafe enum comparison — correctly, since the
 * two are unrelated types as far as TypeScript is concerned.
 */
export const NO_CONTENT_STATUS_CODE: number = HttpStatus.NO_CONTENT;
