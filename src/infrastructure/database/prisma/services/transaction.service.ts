import { Injectable } from '@nestjs/common';

import { AppLoggerService } from '@/core/logger/index.js'; // value import — required for DI metadata

import { PRISMA_TRANSACTION_LOG_CONTEXT, TRANSACTION_DEFAULTS } from '../constants/prisma.constants.js';
import type { AfterCommitHook, TransactionCallback, TransactionOptions } from '../interfaces/index.js';
import { PrismaService } from '../prisma.service.js'; // value import — required for DI metadata

import { TransactionContextService } from './transaction-context.service.js'; // value import — required for DI metadata

@Injectable()
export class TransactionService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly context: TransactionContextService,

    private readonly logger: AppLoggerService,
  ) {}

  async run<T>(operation: TransactionCallback<T>, options: TransactionOptions = {}): Promise<T> {
    const active = this.context.client;

    if (active !== undefined) {
      return operation(active);
    }

    const afterCommitHooks: AfterCommitHook[] = [];

    const result = await this.prisma.client.$transaction(
      (client) => this.context.run({ client, afterCommitHooks }, () => operation(client)),
      {
        timeout: options.timeout ?? TRANSACTION_DEFAULTS.TIMEOUT_MS,
        maxWait: options.maxWait ?? TRANSACTION_DEFAULTS.MAX_WAIT_MS,
        ...(options.isolationLevel !== undefined ? { isolationLevel: options.isolationLevel } : {}),
      },
    );

    await this.drainAfterCommitHooks(afterCommitHooks);

    return result;
  }

  /**
   * Defers work until the current transaction commits.
   *
   * Domain events, emails and webhooks belong here. Publishing them inside the
   * transaction means a rollback still fires them, announcing a lead that does
   * not exist. Outside a transaction the hook runs immediately, so callers do
   * not need to know whether they are in one.
   */
  async runAfterCommit(hook: AfterCommitHook): Promise<void> {
    if (this.context.registerAfterCommit(hook)) {
      return;
    }

    await hook();
  }

  /**
   * Hook failures are logged and swallowed. The transaction is already durable,
   * and a failed notification must not surface as a failed write.
   */
  private async drainAfterCommitHooks(hooks: readonly AfterCommitHook[]): Promise<void> {
    for (const hook of hooks) {
      try {
        await hook();
      } catch (error) {
        this.logger.error(error, 'After-commit hook failed', {
          context: PRISMA_TRANSACTION_LOG_CONTEXT,
          operation: 'drainAfterCommitHooks',
        });
      }
    }
  }
}
