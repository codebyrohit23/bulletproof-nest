/**
 * Public surface of the Prisma module.
 *
 * Providers, extensions and the retry helpers are deliberately not exported —
 * they are construction details owned by `PrismaService`, and nothing outside
 * has any business assembling a client or choosing a backoff policy.
 *
 * `isUniqueConstraintViolation` is the exception, and it is not one grudgingly.
 * *How* a client is built is a construction detail; *what this module throws,
 * and how a caller is meant to read it*, is a contract. Callers need the second
 * to write correct code — an optimistic insert has to be able to recognise the
 * conflict it is deliberately provoking — and the only alternative is for every
 * service to import Prisma's error classes directly, which is exactly what
 * confining Prisma to repositories was meant to prevent.
 */

export { PrismaModule } from './prisma.module.js';

export { PrismaService } from './prisma.service.js';

export { TransactionContextService, TransactionService } from './services/index.js';

export { PrismaHealthIndicator } from './indicators/prisma-health.indicator.js';

export {
  PRISMA_ERROR_CODE,
  PRISMA_HEALTH_KEY,
  SOFT_DELETABLE_MODELS,
  SOFT_DELETE_FIELD,
} from './constants/prisma.constants.js';

export { isUniqueConstraintViolation } from './utils/prisma-error.util.js';

export type {
  AfterCommitHook,
  TransactionCallback,
  TransactionOptions,
  TransactionStore,
} from './interfaces/index.js';

export type { ExtendedPrismaClient, PrismaTransactionClient } from './types/prisma.types.js';
