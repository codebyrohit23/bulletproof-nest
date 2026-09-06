import type { Prisma } from '@prisma/client';

export const PRISMA_LOG_CONTEXT = 'PrismaService';
export const PRISMA_QUERY_LOG_CONTEXT = 'PrismaQuery';
export const PRISMA_TRANSACTION_LOG_CONTEXT = 'PrismaTransaction';

export const DATABASE_RETRY = {
  ATTEMPTS: 5,
  BASE_DELAY_MS: 500,
  MAX_DELAY_MS: 10_000,
  JITTER_RATIO: 0.2,
} as const;

export const TRANSACTION_DEFAULTS = {
  TIMEOUT_MS: 10_000,
  MAX_WAIT_MS: 5_000,
} as const;

export const PRISMA_HEALTH_KEY = 'postgres';
export const HEALTH_CHECK_TIMEOUT_MS = 3_000;

/**
 * The Prisma error codes this application reacts to by name.
 *
 * Only the ones something actually branches on. A full transcription of
 * Prisma's table would be a list nobody maintains — `PrismaExceptionHandler`
 * maps the rest to status codes and needs no names for them.
 */
export const PRISMA_ERROR_CODE = {
  /**
   * A write would have duplicated a unique value.
   *
   * Postgres reports a plain unique constraint and a partial unique index the
   * same way, which is what makes this usable for indexes Prisma's schema
   * language cannot express.
   */
  UNIQUE_CONSTRAINT: 'P2002',
} as const;

export const SOFT_DELETABLE_MODELS = ['User'] as const satisfies readonly Prisma.ModelName[];

export const SOFT_DELETE_FIELD = 'deletedAt';
