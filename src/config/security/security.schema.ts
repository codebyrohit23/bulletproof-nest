import { z } from 'zod';

// `../shared/index.js` re-exports `env.js`, which would make this a startup cycle.
import { booleanEnv } from '../shared/schema.helpers.js';
import { parseCommaSeparated } from '../shared/utils.js';

export const securitySchema = z.object({
  COOKIE_SECRET: z.string().min(32),

  CORS_ENABLED: booleanEnv('true'),

  CORS_ORIGINS: z.string().transform(parseCommaSeparated),

  CORS_CREDENTIALS: booleanEnv('true'),

  RATE_LIMIT_ENABLED: booleanEnv('true'),

  CSRF_ENABLED: booleanEnv('true'),
});
