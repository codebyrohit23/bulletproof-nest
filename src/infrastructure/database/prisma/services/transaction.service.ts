import { Injectable } from '@nestjs/common';

import { AppLoggerService } from '#/core/logger/index.js';

import {
  PRISMA_TRANSACTION_LOG_CONTEXT,
  TRANSACTION_DEFAULTS,
} from '../constants/prisma.constants.js';
import type {
  AfterCommitHook,
  TransactionCallback,
  TransactionOptions,
} from '../interfaces/index.js';
import { PrismaService } from '../prisma.service.js';

import { TransactionContextService } from './transaction-context.service.js';

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

  async runAfterCommit(hook: AfterCommitHook): Promise<void> {
    if (this.context.registerAfterCommit(hook)) {
      return;
    }

    await hook();
  }

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
