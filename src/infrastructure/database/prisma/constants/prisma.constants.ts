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

export const SOFT_DELETABLE_MODELS = ['User'] as const satisfies readonly Prisma.ModelName[];

export const SOFT_DELETE_FIELD = 'deletedAt';
