import { Pool } from 'pg';

import type { PostgresConfig } from '#/config/database/index.js';

export function createPgPool(config: PostgresConfig): Pool {
  return new Pool({
    connectionString: config.url,
    ssl: config.ssl,
    max: config.pool.max,
    idleTimeoutMillis: config.pool.idleTimeoutMs,
    connectionTimeoutMillis: config.pool.connectionTimeoutMs,
    statement_timeout: config.statementTimeoutMs,
    idle_in_transaction_session_timeout: config.idleInTransactionTimeoutMs,
  });
}
