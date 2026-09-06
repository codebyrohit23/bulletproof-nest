export const AUTH_ERROR_MESSAGE = {
  UNAUTHORIZED: 'Authentication failed.',
} as const;

export const AUTH_FAILURE_REASON = {
  TOKEN_MISSING: 'TOKEN_MISSING',

  TOKEN_INVALID: 'TOKEN_INVALID',

  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  SESSION_UNKNOWN: 'SESSION_UNKNOWN',

  SESSION_REVOKED: 'SESSION_REVOKED',

  SESSION_EXPIRED: 'SESSION_EXPIRED',

  DEVICE_MISMATCH: 'DEVICE_MISMATCH',

  DEVICE_ID_MISSING: 'DEVICE_ID_MISSING',

  /**
   * The request context carries no identity where one was required.
   *
   * Unlike every other reason here, this one is never the caller's doing.
   * `UserAuthGuard` sets the identity before any handler runs, so an absent one
   * means the route lost its guard or the context middleware stopped running —
   * a wiring fault, findable only because it is logged under this name.
   */
  IDENTITY_MISSING: 'IDENTITY_MISSING',

  SESSION_UNBOUND: 'SESSION_UNBOUND',

  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',

  ACCOUNT_DEACTIVATED: 'ACCOUNT_DEACTIVATED',

  REFRESH_TOKEN_MISSING: 'REFRESH_TOKEN_MISSING',

  REFRESH_TOKEN_UNKNOWN: 'REFRESH_TOKEN_UNKNOWN',

  REFRESH_TOKEN_EXPIRED: 'REFRESH_TOKEN_EXPIRED',

  REFRESH_TOKEN_REUSED: 'REFRESH_TOKEN_REUSED',

  REFRESH_ROTATION_LOST: 'REFRESH_ROTATION_LOST',
} as const;

export type AuthFailureReason = (typeof AUTH_FAILURE_REASON)[keyof typeof AUTH_FAILURE_REASON];

export const BEARER_SCHEME = 'Bearer';

export const AUTH_LOG_CONTEXT = 'Auth';
