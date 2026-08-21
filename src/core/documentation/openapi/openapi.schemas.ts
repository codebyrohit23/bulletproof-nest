import type { SchemaObject } from '../documentation.types.js';

/**
 * The response envelope, described once per half.
 *
 * These mirror `SuccessResponse` in `core/interceptors` and `ErrorResponse` in
 * `core/exceptions` field for field. They are written by hand rather than
 * derived, because both are *types* and types do not survive to runtime — so
 * the two can drift, and a change to an envelope must be made in both places.
 *
 * That is a real cost, accepted for one reason: an envelope documented nowhere
 * is worse. Clients handle responses against whatever they observed once in a
 * console, and every endpoint that omits it teaches them a slightly different
 * lesson.
 */

/**
 * `meta` is identical on both halves, so it is defined once and referenced by
 * both. Inlining it twice is how the success and error envelopes would come to
 * disagree about a field neither author thought they were changing.
 */
const RESPONSE_META_SCHEMA: SchemaObject = {
  type: 'object',
  required: ['timestamp', 'path'],
  properties: {
    timestamp: { type: 'string', format: 'date-time' },
    path: { type: 'string', example: '/api/v1/leads' },
    requestId: {
      type: 'string',
      format: 'uuid',
      description: 'Ties this response to its log lines. The value to quote in a support ticket.',
    },
  },
};

/**
 * The success envelope **without** `data`.
 *
 * `data` is deliberately absent: it differs per endpoint, and `ApiSuccessResponse`
 * composes it in with `allOf` against the endpoint's own DTO. Declaring it here
 * as a permissive object would document every endpoint as returning "anything",
 * which reads as documented while promising nothing.
 */
export const SUCCESS_RESPONSE_SCHEMA: SchemaObject = {
  type: 'object',
  required: ['success', 'statusCode', 'message', 'data', 'meta'],
  properties: {
    success: {
      type: 'boolean',
      enum: [true],
      description: 'Always true. The discriminator a client branches on.',
    },
    statusCode: {
      type: 'integer',
      example: 200,
      description:
        'Mirrors the HTTP status, so the body is self-contained when it is logged apart from the response.',
    },
    message: {
      type: 'string',
      example: 'Request completed successfully.',
      description:
        'Human-readable summary, safe to surface. Never branch on it — branch on the HTTP status.',
    },
    meta: RESPONSE_META_SCHEMA,
  },
};

/**
 * `stack` is deliberately absent. It exists on `ApiError`, but only outside
 * production, and documenting it would invite a client to depend on something
 * that vanishes in the environment that matters.
 */
export const ERROR_RESPONSE_SCHEMA: SchemaObject = {
  type: 'object',
  required: ['success', 'statusCode', 'message', 'error', 'meta'],
  properties: {
    success: {
      type: 'boolean',
      enum: [false],
      description: 'Always false. The discriminator a client branches on.',
    },
    statusCode: {
      type: 'integer',
      example: 400,
      description:
        'Mirrors the HTTP status, so the body is self-contained when it is logged apart from the response.',
    },
    message: {
      type: 'string',
      example: 'Validation failed.',
      description: 'Human-readable summary. Safe to surface; never contains internal detail.',
    },
    error: {
      type: 'object',
      required: ['code'],
      properties: {
        code: {
          type: 'string',
          example: 'VALIDATION_FAILED',
          description: 'Stable machine-readable identifier. Branch on this, never on `message`.',
        },
        name: { type: 'string', example: 'ZodError' },
        details: { description: 'Additional context. Shape varies by `code`.' },
      },
    },
    validationErrors: {
      type: 'array',
      description:
        'Present only when `error.code` is `VALIDATION_FAILED`. One entry per rejected field.',
      items: {
        type: 'object',
        required: ['field', 'message'],
        properties: {
          field: { type: 'string', example: 'email' },
          message: { type: 'string', example: 'Invalid email address' },
          code: { type: 'string', example: 'invalid_string' },
        },
      },
    },
    meta: RESPONSE_META_SCHEMA,
  },
};
