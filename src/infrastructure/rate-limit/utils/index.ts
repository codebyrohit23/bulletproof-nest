import type { RateLimiterRes } from 'rate-limiter-flexible';

import { type RateLimitWindow } from '../interfaces/index.js';

export const toWindow = (allowed: boolean, result: RateLimiterRes): RateLimitWindow => {
  return {
    allowed,
    remaining: Math.max(0, result.remainingPoints),
    resetInMs: Math.max(0, result.msBeforeNext),
  };
};
