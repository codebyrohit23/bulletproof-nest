/**
 * ============================================================================
 * Exception Error Codes
 * ============================================================================
 */

export const EXCEPTION_CODE = {
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',

  VALIDATION_FAILED: 'VALIDATION_FAILED',

  BAD_REQUEST: 'BAD_REQUEST',

  UNAUTHORIZED: 'UNAUTHORIZED',

  FORBIDDEN: 'FORBIDDEN',

  NOT_FOUND: 'NOT_FOUND',

  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',

  CONFLICT: 'CONFLICT',

  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',

  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
} as const;

export type ExceptionCode = (typeof EXCEPTION_CODE)[keyof typeof EXCEPTION_CODE];

/**
 * ============================================================================
 * Default Error Messages
 * ============================================================================
 */

export const EXCEPTION_MESSAGE = {
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred.',

  VALIDATION_FAILED: 'Validation failed.',

  BAD_REQUEST: 'Bad request.',

  UNAUTHORIZED: 'Unauthorized.',

  FORBIDDEN: 'Forbidden.',

  NOT_FOUND: 'Resource not found.',

  METHOD_NOT_ALLOWED: 'Method not allowed.',

  CONFLICT: 'Resource already exists.',

  UNPROCESSABLE_ENTITY: 'Unprocessable entity.',

  TOO_MANY_REQUESTS: 'Too many requests.',

  SERVICE_UNAVAILABLE: 'Service unavailable.',

  GATEWAY_TIMEOUT: 'Gateway timeout.',
} as const;

/**
 * ============================================================================
 * Environment Messages
 * ============================================================================
 */

export const DEVELOPMENT_EXCEPTION_MESSAGE = 'See error details for more information.';

export const PRODUCTION_EXCEPTION_MESSAGE = 'Something went wrong. Please try again later.';

/**
 * ============================================================================
 * Validation
 * ============================================================================
 */

export const VALIDATION_EXCEPTION_CODE = EXCEPTION_CODE.VALIDATION_FAILED;

/**
 * ============================================================================
 * Unknown Exception
 * ============================================================================
 */

export const UNKNOWN_EXCEPTION_NAME = 'UnknownException';

/**
 * ============================================================================
 * Response
 * ============================================================================
 */

export const ERROR_RESPONSE_SUCCESS = false as const;

export const EXCEPTION_HANDLERS = Symbol('EXCEPTION_HANDLERS');
