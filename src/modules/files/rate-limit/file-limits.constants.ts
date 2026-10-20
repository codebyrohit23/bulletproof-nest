import { RATE_LIMIT_SUBJECT, type RateLimitDefinition } from '#/core/rate-limit/index.js';

const ONE_HOUR_MS = 60 * 60 * 1000;

export const FILE_RATE_LIMIT = {
  UPLOAD: [
    {
      name: 'file-upload-by-ip',
      rule: { limit: 60, windowMs: ONE_HOUR_MS },
      by: RATE_LIMIT_SUBJECT.IP,
    },
  ],
} as const satisfies Record<string, readonly RateLimitDefinition[]>;
