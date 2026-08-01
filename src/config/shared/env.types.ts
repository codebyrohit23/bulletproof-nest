import type { z } from 'zod';

import type { envSchema } from './schema.js';

export type ValidatedEnv = z.infer<typeof envSchema>;
