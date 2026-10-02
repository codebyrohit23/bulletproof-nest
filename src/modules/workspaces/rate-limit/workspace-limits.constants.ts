import { RATE_LIMIT_SUBJECT, type RateLimitDefinition } from '#/core/rate-limit/index.js';

const ONE_HOUR_MS = 60 * 60 * 1000;

export const WORKSPACE_RATE_LIMIT = {
  CREATE: [
    {
      name: 'create-workspace-by-ip',
      rule: { limit: 10, windowMs: ONE_HOUR_MS },
      by: RATE_LIMIT_SUBJECT.IP,
    },
  ],
} as const satisfies Record<string, readonly RateLimitDefinition[]>;
