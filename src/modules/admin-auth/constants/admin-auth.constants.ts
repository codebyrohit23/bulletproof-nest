import { API_PREFIX, API_VERSION_PREFIX, ApiVersion } from '#/shared/constants/index.js';

export const ADMIN_AUTH_LOG_CONTEXT = 'AdminAuth';

export const ADMIN_AUTH_RESULT_STATUS = {
  AUTHENTICATED: 'AUTHENTICATED',
} as const;

export type AdminAuthResultStatus =
  (typeof ADMIN_AUTH_RESULT_STATUS)[keyof typeof ADMIN_AUTH_RESULT_STATUS];

export const ADMIN_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const ADMIN_REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const ADMIN_SESSION_ACTIVITY_THROTTLE_MS = 5 * 60 * 1000;

export const ADMIN_REFRESH_TOKEN_COOKIE = {
  NAME: 'lf_art',

  PATH: `/${API_PREFIX}/${API_VERSION_PREFIX}${ApiVersion.V1}/admin/auth`,

  MAX_AGE_SECONDS: ADMIN_REFRESH_TOKEN_TTL_MS / 1000,
} as const;
