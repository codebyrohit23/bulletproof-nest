import { RATE_LIMIT_SUBJECT, type RateLimitDefinition } from '#/core/rate-limit/index.js';

const MINUTE_MS = 60 * 1000;

const FIVE_MINUTES_MS = 5 * MINUTE_MS;

const ONE_HOUR_MS = 60 * MINUTE_MS;

export const ADMIN_AUTH_RATE_LIMIT = {
  LOGIN: [
    {
      name: 'admin-login',
      rule: { limit: 5, windowMs: FIVE_MINUTES_MS },
      by: { bodyField: 'email' },
    },
    {
      name: 'admin-login-hourly',
      rule: { limit: 15, windowMs: ONE_HOUR_MS },
      by: { bodyField: 'email' },
    },
    {
      name: 'admin-login-by-ip',
      rule: { limit: 20, windowMs: FIVE_MINUTES_MS },
      by: RATE_LIMIT_SUBJECT.IP,
    },
  ],
} as const satisfies Record<string, readonly RateLimitDefinition[]>;
