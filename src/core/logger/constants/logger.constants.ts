export const LOG_LEVEL = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
} as const;

export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

export const LOG_FORMAT = {
  JSON: 'json',
  PRETTY: 'pretty',
} as const;

export type LogFormat = (typeof LOG_FORMAT)[keyof typeof LOG_FORMAT];

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
