import { z } from 'zod';

import { optionalEnv } from '../shared/index.js';

export const seedSchema = z.object({
  SEED_ADMIN_EMAIL: optionalEnv(z.email()),

  SEED_ADMIN_NAME: z.string().trim().min(1).max(100).default('Admin'),
});
