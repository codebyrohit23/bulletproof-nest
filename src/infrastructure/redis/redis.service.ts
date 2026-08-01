import { Injectable, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { RedisConfigService } from '@/config/redis/index.js'; // value import — required for DI metadata
import { AppLoggerService } from '@/core/logger/index.js'; // value import — required for DI metadata

import {
  REDIS_CLIENT,
  REDIS_HEALTH_TIMEOUT_MS,
  REDIS_LOG_CONTEXT,
  REDIS_PING_REPLY,
  type RedisClientName,
} from './constants/redis.constants.js';
import { createRedisClient } from './providers/index.js';

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private readonly clients = new Map<RedisClientName, Redis>();

  constructor(
    private readonly redisConfig: RedisConfigService,

    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Only the default client is opened at startup.
   *
   * The queue and subscriber connections are created on first use. Managed and
   * free tiers cap concurrent connections, and opening three when the
   * application uses one wastes a third of a small budget.
   */
  onModuleInit(): void {
    this.getClient(REDIS_CLIENT.DEFAULT);
  }

  /**
   * The default client — cache, locks, rate limiting.
   */
  get client(): Redis {
    return this.getClient(REDIS_CLIENT.DEFAULT);
  }

  /**
   * Returns a named client, opening it on first request.
   *
   * Consumers must go through here rather than constructing their own: a stray
   * client is invisible to the health probe and is never closed on shutdown.
   */
  getClient(name: RedisClientName): Redis {
    const existing = this.clients.get(name);

    if (existing !== undefined) {
      return existing;
    }

    const client = createRedisClient(name, this.redisConfig);

    this.registerListeners(name, client);
    this.clients.set(name, client);

    return client;
  }

  /**
   * Liveness probe used by the health indicator.
   *
   * Bounded independently of the command timeout because probes run every few
   * seconds and must fail fast rather than queue up behind each other.
   */
  async isHealthy(): Promise<boolean> {
    const reply = await this.withTimeout(this.client.ping(), REDIS_HEALTH_TIMEOUT_MS);

    return reply === REDIS_PING_REPLY;
  }

  /**
   * Closes every client that was opened.
   *
   * `quit()` waits for in-flight commands and sends `QUIT`; `disconnect()`
   * would drop them. If a client is already unreachable the quit itself can
   * fail, which must not stop the remaining ones from closing — hence the
   * per-client catch.
   */
  async onApplicationShutdown(): Promise<void> {
    const closings = [...this.clients.entries()].map(async ([name, client]) => {
      try {
        await client.quit();
      } catch (error) {
        this.logger.warn(`Redis client "${name}" did not close cleanly`, {
          context: REDIS_LOG_CONTEXT,
          operation: 'onApplicationShutdown',
          metadata: { client: name, reason: error instanceof Error ? error.message : 'unknown' },
        });

        client.disconnect();
      }
    });

    await Promise.all(closings);

    this.clients.clear();

    this.logger.info('Redis connections closed', {
      context: REDIS_LOG_CONTEXT,
      operation: 'onApplicationShutdown',
    });
  }

  /**
   * An ioredis client with no `error` listener emits an unhandled `error` event,
   * which crashes the Node process. Redis being briefly unreachable must never
   * do that — every client gets a listener before it is handed out.
   */
  private registerListeners(name: RedisClientName, client: Redis): void {
    client.on('error', (error: Error) => {
      this.logger.error(error, `Redis client "${name}" error`, {
        context: REDIS_LOG_CONTEXT,
        metadata: { client: name },
      });
    });

    client.on('ready', () => {
      this.logger.info(`Redis client "${name}" ready`, {
        context: REDIS_LOG_CONTEXT,
        metadata: { client: name },
      });
    });

    client.on('reconnecting', (delayMs: number) => {
      this.logger.warn(`Redis client "${name}" reconnecting`, {
        context: REDIS_LOG_CONTEXT,
        metadata: { client: name, delayMs },
      });
    });

    client.on('end', () => {
      this.logger.warn(`Redis client "${name}" connection ended`, {
        context: REDIS_LOG_CONTEXT,
        metadata: { client: name },
      });
    });
  }

  private async withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout | undefined;

    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Redis health check timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([operation, timeout]);
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    }
  }
}
