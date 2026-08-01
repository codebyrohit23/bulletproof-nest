/**
 * Public surface of the Prisma module.
 *
 * Providers, extensions and utils are deliberately not exported — they are
 * construction details owned by `PrismaService`.
 */

export { PrismaModule } from './prisma.module.js';

export { PrismaService } from './prisma.service.js';

export { TransactionContextService, TransactionService } from './services/index.js';

export { PrismaHealthIndicator } from './indicators/prisma-health.indicator.js';

export { PRISMA_HEALTH_KEY, SOFT_DELETABLE_MODELS, SOFT_DELETE_FIELD } from './constants/prisma.constants.js';

export type { AfterCommitHook, TransactionCallback, TransactionOptions, TransactionStore } from './interfaces/index.js';

export type { ExtendedPrismaClient, PrismaTransactionClient } from './types/prisma.types.js';
