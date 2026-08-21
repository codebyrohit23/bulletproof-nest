import { z } from 'zod';

import { booleanEnv, enumListEnv, positiveIntEnv } from '../shared/schema.helpers.js';

import {
  POSTGRES_POOL_DEFAULTS,
  POSTGRES_SLOW_QUERY_THRESHOLD_MS,
  PRISMA_LOG_LEVELS,
} from './database.constants.js';

export const databaseSchema = z.object({
  POSTGRES_DATABASE_URL: z.url(),

  POSTGRES_SSL: booleanEnv('false'),

  POSTGRES_LOG_LEVEL: enumListEnv(PRISMA_LOG_LEVELS, 'warn,error'),

  POSTGRES_POOL_MAX: positiveIntEnv(POSTGRES_POOL_DEFAULTS.MAX),

  POSTGRES_POOL_IDLE_TIMEOUT_MS: positiveIntEnv(POSTGRES_POOL_DEFAULTS.IDLE_TIMEOUT_MS),

  POSTGRES_POOL_CONNECTION_TIMEOUT_MS: positiveIntEnv(POSTGRES_POOL_DEFAULTS.CONNECTION_TIMEOUT_MS),

  POSTGRES_SLOW_QUERY_THRESHOLD_MS: positiveIntEnv(POSTGRES_SLOW_QUERY_THRESHOLD_MS),
});
