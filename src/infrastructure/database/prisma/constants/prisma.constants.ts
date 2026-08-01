import type { Prisma } from '@prisma/client';

/**
 * Logger contexts. Every log line emitted by this module carries one of these.
 */
export const PRISMA_LOG_CONTEXT = 'PrismaService';
export const PRISMA_QUERY_LOG_CONTEXT = 'PrismaQuery';
export const PRISMA_TRANSACTION_LOG_CONTEXT = 'PrismaTransaction';

/**
 * Connection retry policy, applied only during startup.
 *
 * Jitter is not optional: without it every replica retries in lockstep and
 * stampedes a database that is still recovering.
 */
export const DATABASE_RETRY = {
  ATTEMPTS: 5,
  BASE_DELAY_MS: 500,
  MAX_DELAY_MS: 10_000,
  JITTER_RATIO: 0.2,
} as const;

/**
 * Transaction defaults.
 *
 * `TIMEOUT_MS` is how long the callback may run once started.
 * `MAX_WAIT_MS` is how long Prisma waits for a free connection before failing.
 */
export const TRANSACTION_DEFAULTS = {
  TIMEOUT_MS: 10_000,
  MAX_WAIT_MS: 5_000,
} as const;

/**
 * Health probe. The key is what Terminus reports under.
 */
export const PRISMA_HEALTH_KEY = 'postgres';
export const HEALTH_CHECK_TIMEOUT_MS = 3_000;

/**
 * Models carrying a `deletedAt` column.
 *
 * The soft-delete extension applies to these and only these. Adding a model
 * here is a deliberate, reviewable decision — never infer it at runtime.
 */
export const SOFT_DELETABLE_MODELS = ['User'] as const satisfies readonly Prisma.ModelName[];

/**
 * The column used by the soft-delete extension.
 */
export const SOFT_DELETE_FIELD = 'deletedAt';
