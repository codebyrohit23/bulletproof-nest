export const RATE_LIMIT_LOG_CONTEXT = 'RateLimit';

export const RATE_LIMIT_SCOPE = {
  TENANT: 'ws',

  GLOBAL: 'global',
} as const;

export const RATE_LIMIT_VERSION_PREFIX = 'v';

export const RATE_LIMIT_STORE_FAILURE = {
  ALLOW: 'ALLOW',

  DENY: 'DENY',
} as const;

export type RateLimitStoreFailurePolicy =
  (typeof RATE_LIMIT_STORE_FAILURE)[keyof typeof RATE_LIMIT_STORE_FAILURE];

export const RATE_LIMIT_MS_PER_SECOND = 1_000;

export const RATE_LIMIT_METADATA = 'rate-limit:definitions';

export const RATE_LIMIT_SKIP_METADATA = 'rate-limit:skip';

export const RATE_LIMIT_SUBJECT = {
  IP: 'ip',
} as const;

export type RateLimitSubject = (typeof RATE_LIMIT_SUBJECT)[keyof typeof RATE_LIMIT_SUBJECT];

export const RATE_LIMIT_DEFAULT_VERSION = 1;

export const RATE_LIMIT_SUBJECT_DIGEST_LENGTH = 32;

export const RATE_LIMIT_UNRESOLVED_SUBJECT = 'unresolved';

export const RATE_LIMIT_FLOOR = {
  NAME: 'floor-ip',

  LIMIT: 1_200,

  WINDOW_MS: 60 * RATE_LIMIT_MS_PER_SECOND,
} as const;

export const RATE_LIMIT_ERROR_MESSAGE = {
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
} as const;
