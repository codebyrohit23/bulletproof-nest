export { DatabaseConfigService } from './database-config.service.js';

export { databaseConfig } from './database.config.js';

export { databaseSchema } from './database.schema.js';

export {
  POSTGRES_POOL_DEFAULTS,
  POSTGRES_SLOW_QUERY_THRESHOLD_MS,
  PRISMA_LOG_LEVELS,
  type PrismaLogLevel,
} from './database.constants.js';

export type { DatabaseConfig, PostgresConfig, PostgresPoolConfig } from './database.interface.js';
