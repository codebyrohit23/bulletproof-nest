export const LOG_LEVEL = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  FATAL: 'fatal',
} as const;

export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

export const LOGGER_CONTEXT = 'Application';

// Request/correlation header names live in `core/context` — it is what reads
// them off the wire. Import them from there rather than redefining them here.

export const LOGGER_REDACT_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.confirmPassword',
  'req.body.token',
  'req.body.refreshToken',
  'req.body.accessToken',
  'req.body.secret',
] as const;
