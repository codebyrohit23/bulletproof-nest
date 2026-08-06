import { Injectable, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import type { Pool } from 'pg';

import { DatabaseConfigService } from '#/config/database/index.js'; // value import — required for DI metadata
import { AppLoggerService } from '#/core/logger/index.js'; // value import — required for DI metadata

import { DATABASE_RETRY, PRISMA_LOG_CONTEXT } from './constants/prisma.constants.js';
import { applyPrismaExtensions } from './extensions/index.js';
import { createPgPool, createPrismaClient, registerPrismaLogHandlers } from './providers/index.js';
import { TransactionContextService } from './services/transaction-context.service.js'; // value import — required for DI metadata
import type { BasePrismaClient, ExtendedPrismaClient, PrismaTransactionClient } from './types/prisma.types.js';
import { retryAsync } from './utils/retry.util.js';

@Injectable()
export class PrismaService implements OnModuleInit, OnApplicationShutdown {
  private readonly pool: Pool;

  private readonly base: BasePrismaClient;

  private readonly extended: ExtendedPrismaClient;

  constructor(
    private readonly databaseConfig: DatabaseConfigService,

    private readonly logger: AppLoggerService,

    private readonly transactionContext: TransactionContextService,
  ) {
    const postgres = this.databaseConfig.postgres;

    this.pool = createPgPool(postgres);
    this.base = createPrismaClient(this.pool);

    registerPrismaLogHandlers(this.base, this.logger, postgres.logLevel);

    this.extended = applyPrismaExtensions(this.base, {
      logger: this.logger,
      slowQueryThresholdMs: postgres.slowQueryThresholdMs,
    });
  }

  /**
   * The entry point for every repository.
   *
   * Returns the active transaction client when one is in progress and the root
   * client otherwise, which is what allows a repository to be written once and
   * behave correctly in both cases. Never construct a `PrismaClient` elsewhere.
   */
  get db(): PrismaTransactionClient {
    return this.transactionContext.client ?? this.extended;
  }

  /**
   * The full client, including `$transaction`.
   *
   * Internal to this module — `TransactionService` needs it to open a
   * transaction. Repositories must use {@link db}.
   */
  get client(): ExtendedPrismaClient {
    return this.extended;
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  /**
   * Closes the client and then the pool.
   *
   * This is `onApplicationShutdown`, not `onModuleDestroy`. Nest's order is
   * `onModuleDestroy` → `beforeApplicationShutdown` → HTTP server closes →
   * `onApplicationShutdown`, so closing the pool in `onModuleDestroy` would
   * pull the database out from under requests that are still being served. By
   * this hook the server has stopped and nothing else needs a connection.
   *
   * `$disconnect()` alone is not enough — it leaves the underlying pg sockets
   * open, which leaks connections on every rolling deploy.
   */
  async onApplicationShutdown(): Promise<void> {
    await this.base.$disconnect();
    await this.pool.end();

    this.logger.info('Database connection closed', { context: PRISMA_LOG_CONTEXT });
  }

  /**
   * Liveness probe used by the health indicator.
   */
  async isHealthy(): Promise<boolean> {
    await this.base.$queryRaw`SELECT 1`;

    return true;
  }

  private async connect(): Promise<void> {
    try {
      await retryAsync(
        () => this.base.$connect(),
        {
          attempts: DATABASE_RETRY.ATTEMPTS,
          baseDelayMs: DATABASE_RETRY.BASE_DELAY_MS,
          maxDelayMs: DATABASE_RETRY.MAX_DELAY_MS,
          jitterRatio: DATABASE_RETRY.JITTER_RATIO,
        },
        (attempt, delayMs) => {
          this.logger.warn(`Database connection attempt ${attempt} failed — retrying in ${delayMs}ms`, {
            context: PRISMA_LOG_CONTEXT,
            operation: 'connect',
            metadata: { attempt, delayMs, maxAttempts: DATABASE_RETRY.ATTEMPTS },
          });
        },
      );
    } catch (error) {
      this.logger.error(error, `Database connection failed after ${DATABASE_RETRY.ATTEMPTS} attempts`, {
        context: PRISMA_LOG_CONTEXT,
        operation: 'connect',
      });

      throw error;
    }

    this.logger.info('Database connection established', {
      context: PRISMA_LOG_CONTEXT,
      operation: 'connect',
      metadata: { poolMax: this.databaseConfig.postgres.pool.max },
    });
  }
}
