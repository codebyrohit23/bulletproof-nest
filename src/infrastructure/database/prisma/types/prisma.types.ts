import type { applyPrismaExtensions } from '../extensions/extension.registry.js';
import type { createPrismaClient } from '../providers/prisma-client.provider.js';

/**
 * The unextended client. Only `PrismaService` and `prisma-log.provider` touch
 * this — it is the one place `$on` is still available.
 */
export type BasePrismaClient = ReturnType<typeof createPrismaClient>;

/**
 * The client with every extension applied. This is what the application runs on.
 */
export type ExtendedPrismaClient = ReturnType<typeof applyPrismaExtensions>;

/**
 * Operations Prisma strips from the client it hands to a `$transaction` callback.
 */
type TransactionDenyList =
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends';

/**
 * What repositories are given by `PrismaService.db`.
 *
 * Deliberately narrower than `ExtendedPrismaClient`: a repository must not be
 * able to open its own transaction or close the connection. It is also the
 * exact shape Prisma passes into a `$transaction` callback, which is what lets
 * the same repository code run inside and outside a transaction unchanged.
 */
export type PrismaTransactionClient = Omit<ExtendedPrismaClient, TransactionDenyList>;
