import { Injectable, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import type { Redis } from 'ioredis';

import { RedisConfigService } from '#/config/redis/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import { withTimeout } from '#/shared/utils/index.js';

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

  onModuleInit(): void {
    this.getClient(REDIS_CLIENT.DEFAULT);
  }

  get client(): Redis {
    return this.getClient(REDIS_CLIENT.DEFAULT);
  }

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

  async isHealthy(): Promise<boolean> {
    const reply = await withTimeout(
      this.client.ping(),
      REDIS_HEALTH_TIMEOUT_MS,
      'Redis health check',
    );

    return reply === REDIS_PING_REPLY;
  }

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
}
