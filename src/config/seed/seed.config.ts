import { registerAs } from '@nestjs/config';

import { env } from '../shared/env.js';

import type { SeedConfig } from './seed.interface.js';

export const seedConfig = registerAs('seed', (): SeedConfig => ({
  adminEmail: env.SEED_ADMIN_EMAIL,

  adminName: env.SEED_ADMIN_NAME,
}));
