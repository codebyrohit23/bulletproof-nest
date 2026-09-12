/*
 * `LOG_LEVEL` and `LOG_FORMAT` are in `shared/constants/log.constants.ts`.
 * `config/app` validates them from the environment and this module acts on
 * them, so neither can own the list — and `config/` may import only from
 * `shared/`.
 */

export const LOGGER_CONTEXT = 'Application';

export const LOGGER_SERVICE_NAME = 'leadflow-backend-service';

export const LOGGER_SILENT_LEVEL = 'silent';

const SENSITIVE_FIELD_NAMES = [
  /* Credentials. */
  'password',
  'currentPassword',
  'newPassword',
  'confirmPassword',
  'passwordHash',

  /* One-time codes. `code` is the name in use; `otp` is kept for safety. */
  'code',
  'codeHash',
  'otp',

  /* Bearer and opaque tokens, and the digests they are stored as. */
  'token',
  'tokenHash',
  'accessToken',
  'refreshToken',
  'resetToken',

  /* Anything a provider issued to us. */
  'secret',
  'apiKey',
] as const;

export const LOGGER_REDACT_PATHS: readonly string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',

  ...SENSITIVE_FIELD_NAMES,
  ...SENSITIVE_FIELD_NAMES.map((field) => `*.${field}`),
];

export const LOGGER_QUIET_ROUTE_PATTERN =
  /^\/(?:health(?:\/(?:live|ready))?|metrics|favicon\.ico)$/;

export const LOGGER_USER_AGENT_MAX_LENGTH = 200;

export const LOGGER_SERVER_ERROR_STATUS = 500;

export const LOGGER_CLIENT_ERROR_STATUS = 400;
