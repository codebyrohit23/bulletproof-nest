import { API_PREFIX, API_VERSION_PREFIX, ApiVersion } from '#/shared/constants/index.js';

export const USER_AUTH_LOG_CONTEXT = 'UserAuth';

export const USER_AUTH_RESULT_STATUS = {
  AUTHENTICATED: 'AUTHENTICATED',

  VERIFICATION_REQUIRED: 'VERIFICATION_REQUIRED',
} as const;

export type UserAuthResultStatus =
  (typeof USER_AUTH_RESULT_STATUS)[keyof typeof USER_AUTH_RESULT_STATUS];

export const USER_REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const USER_REFRESH_TOKEN_MAX_LENGTH = 128;

export const USER_PASSWORD_RESET_TOKEN_MAX_LENGTH = 128;

export const USER_REFRESH_TOKEN_COOKIE = {
  NAME: 'lf_rt',

  PATH: `/${API_PREFIX}/${API_VERSION_PREFIX}${ApiVersion.V1}/auth`,

  MAX_AGE_SECONDS: USER_REFRESH_TOKEN_TTL_MS / 1000,
} as const;

export const USER_TOKEN_DELIVERY = {
  COOKIE: 'COOKIE',

  BODY: 'BODY',
} as const;

export type UserTokenDelivery = (typeof USER_TOKEN_DELIVERY)[keyof typeof USER_TOKEN_DELIVERY];

export const USER_PASSWORD_RESET_TOKEN_TTL_MS = 10 * 60 * 1000;

export const USER_PASSWORD_RESET_TOKEN_TTL_SECONDS = USER_PASSWORD_RESET_TOKEN_TTL_MS / 1000;

export const USER_SESSION_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export const USER_SESSION_ACTIVITY_THROTTLE_MS = 5 * 60 * 1000;

export const USER_DEVICE_FIELD_MAX_LENGTH = {
  NAME: 255,

  BROWSER_NAME: 100,

  BROWSER_VERSION: 50,

  OS_NAME: 100,

  OS_VERSION: 100,
} as const;
