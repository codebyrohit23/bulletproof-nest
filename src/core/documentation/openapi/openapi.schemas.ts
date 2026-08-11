import type { SchemaObject } from '../documentation.types.js';

/**
 * The error envelope, described once.
 *
 * This mirrors `ErrorResponse` in `core/exceptions` field for field. It is
 * written by hand rather than derived, because the interface is a *type* and
 * types do not survive to runtime — so the two can drift, and a change to the
 * envelope must be made in both places.
 *
 * That is a real cost, accepted for one reason: an error shape documented
 * nowhere is worse. Clients handle failures against whatever they observed once
 * in a console, and every endpoint that omits it teaches them a slightly
 * different lesson.
 *
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
      description: 'Mirrors the HTTP status, so the body is self-contained when it is logged apart from the response.',
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
      description: 'Present only when `error.code` is `VALIDATION_FAILED`. One entry per rejected field.',
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
    meta: {
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
    },
  },
};
