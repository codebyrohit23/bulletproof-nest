export const PRISMA_LOG_LEVELS = ['query', 'info', 'warn', 'error'] as const;
export type PrismaLogLevel = (typeof PRISMA_LOG_LEVELS)[number];

/**
 * Connection pool defaults.
 *
 * `MAX` is per process. Multiply it by the replica count before comparing
 * against the Postgres `max_connections` limit.
 */
export const POSTGRES_POOL_DEFAULTS = {
  MAX: 10,
  IDLE_TIMEOUT_MS: 30_000,
  CONNECTION_TIMEOUT_MS: 5_000,
} as const;

/**
 * Queries slower than this are logged at `warn` instead of `debug`.
 */
export const POSTGRES_SLOW_QUERY_THRESHOLD_MS = 200;
