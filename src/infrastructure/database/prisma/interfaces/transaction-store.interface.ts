import type { PrismaTransactionClient } from '../types/prisma.types.js';

import type { AfterCommitHook } from './transaction-options.interface.js';

/**
 * What lives in the transaction `AsyncLocalStorage` for the duration of one
 * transaction.
 *
 * This is deliberately separate from the request context: a BullMQ job or a
 * cron task runs transactions with no HTTP request at all, and a single request
 * may run several transactions in sequence.
 */
export interface TransactionStore {
  /**
   * The active transaction client. `PrismaService.db` returns this instead of
   * the root client whenever a transaction is in progress, which is what makes
   * a repository work identically inside and outside a transaction.
   */
  readonly client: PrismaTransactionClient;

  /**
   * Drained by `TransactionService` after the commit succeeds. Never drained on
   * rollback — that is the whole point of deferring them.
   */
  readonly afterCommitHooks: AfterCommitHook[];
}
