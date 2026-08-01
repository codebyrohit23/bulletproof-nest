import type { Prisma } from '@prisma/client';

import type { PrismaTransactionClient } from '../types/prisma.types.js';

export interface TransactionOptions {
  /**
   * Defaults to the database default (`ReadCommitted` on Postgres).
   * Raise to `Serializable` only for operations that must not interleave.
   */
  readonly isolationLevel?: Prisma.TransactionIsolationLevel;

  /**
   * How long the callback may run once the transaction has started.
   */
  readonly timeout?: number;

  /**
   * How long Prisma waits for a free connection before giving up.
   */
  readonly maxWait?: number;
}

/**
 * The transaction client is passed in for readability, but it is the same
 * client `PrismaService.db` resolves to inside this callback — repositories do
 * not need to receive it.
 */
export type TransactionCallback<T> = (client: PrismaTransactionClient) => Promise<T>;

/**
 * Runs only after the transaction has committed. A hook that throws is logged
 * and swallowed: the write is already durable and must not be reported as failed.
 */
export type AfterCommitHook = () => void | Promise<void>;
