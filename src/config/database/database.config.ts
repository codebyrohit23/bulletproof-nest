import { registerAs } from '@nestjs/config';

import { env } from '../shared/env.js';

import type { DatabaseConfig } from './database.interface.js';

export const databaseConfig = registerAs('database', (): DatabaseConfig => ({
  postgres: {
    url: env.POSTGRES_DATABASE_URL,

    ssl: env.POSTGRES_SSL,

    logLevel: env.POSTGRES_LOG_LEVEL,

    slowQueryThresholdMs: env.POSTGRES_SLOW_QUERY_THRESHOLD_MS,

    pool: {
      max: env.POSTGRES_POOL_MAX,

      idleTimeoutMs: env.POSTGRES_POOL_IDLE_TIMEOUT_MS,

      connectionTimeoutMs: env.POSTGRES_POOL_CONNECTION_TIMEOUT_MS,
    },
  },
}));
