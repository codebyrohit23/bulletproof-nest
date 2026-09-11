import { z } from 'zod';

import { booleanEnv, parseCommaSeparated, trustProxyEnv } from '../shared/index.js';

export const securitySchema = z.object({
  COOKIE_SECRET: z.string().min(32),

  CORS_ENABLED: booleanEnv('true'),

  CORS_ORIGINS: z.string().transform(parseCommaSeparated),

  CORS_CREDENTIALS: booleanEnv('true'),

  RATE_LIMIT_ENABLED: booleanEnv('true'),

  CSRF_ENABLED: booleanEnv('true'),

  /** Read by `main.ts` only — an adapter option, built before the container. */
  TRUST_PROXY: trustProxyEnv('false'),
});
