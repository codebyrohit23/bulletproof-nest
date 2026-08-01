import { Pool } from 'pg';

import type { PostgresConfig } from '@/config/database/index.js';

/**
 * Creates the underlying `pg` connection pool.
 *
 * Prisma's driver adapter does not own this pool — `PrismaService` does, and it
 * is responsible for calling `pool.end()` on shutdown. `$disconnect()` alone
 * leaves the sockets open and leaks connections across rolling deploys.
 */
export function createPgPool(config: PostgresConfig): Pool {
  return new Pool({
    connectionString: config.url,
    ssl: config.ssl,
    max: config.pool.max,
    idleTimeoutMillis: config.pool.idleTimeoutMs,
    connectionTimeoutMillis: config.pool.connectionTimeoutMs,
  });
}
