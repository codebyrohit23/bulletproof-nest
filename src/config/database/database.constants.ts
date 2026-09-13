export const PRISMA_LOG_LEVELS = ['query', 'info', 'warn', 'error'] as const;
export type PrismaLogLevel = (typeof PRISMA_LOG_LEVELS)[number];

export const POSTGRES_POOL_DEFAULTS = {
  MAX: 10,
  IDLE_TIMEOUT_MS: 30_000,
  CONNECTION_TIMEOUT_MS: 5_000,
} as const;

export const POSTGRES_TIMEOUT_DEFAULTS = {
  STATEMENT_TIMEOUT_MS: 10_000,
  IDLE_IN_TRANSACTION_TIMEOUT_MS: 15_000,
} as const;

export const POSTGRES_SLOW_QUERY_THRESHOLD_MS = 200;
