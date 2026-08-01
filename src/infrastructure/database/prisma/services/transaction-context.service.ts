import { AsyncLocalStorage } from 'node:async_hooks';

import { Injectable } from '@nestjs/common';

import type { AfterCommitHook, TransactionStore } from '../interfaces/index.js';
import type { PrismaTransactionClient } from '../types/prisma.types.js';

@Injectable()
export class TransactionContextService {
  private readonly storage = new AsyncLocalStorage<TransactionStore>();

  get client(): PrismaTransactionClient | undefined {
    return this.storage.getStore()?.client;
  }

  get isActive(): boolean {
    return this.storage.getStore() !== undefined;
  }

  run<T>(store: TransactionStore, callback: () => Promise<T>): Promise<T> {
    return this.storage.run(store, callback);
  }

  registerAfterCommit(hook: AfterCommitHook): boolean {
    const store = this.storage.getStore();

    if (store === undefined) {
      return false;
    }

    store.afterCommitHooks.push(hook);

    return true;
  }
}
