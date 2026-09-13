import type { PrismaLogLevel } from './database.constants.js';

export interface DatabaseConfig {
  readonly postgres: PostgresConfig;
}

export interface PostgresConfig {
  readonly url: string;

  readonly directUrl: string;

  readonly ssl: boolean;

  readonly logLevel: readonly PrismaLogLevel[];

  readonly slowQueryThresholdMs: number;

  readonly statementTimeoutMs: number;

  readonly idleInTransactionTimeoutMs: number;

  readonly pool: PostgresPoolConfig;
}

export interface PostgresPoolConfig {
  readonly max: number;

  readonly idleTimeoutMs: number;

  readonly connectionTimeoutMs: number;
}
