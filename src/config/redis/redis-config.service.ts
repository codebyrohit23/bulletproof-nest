import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // value import — required for DI metadata

import type { RedisConfig, RedisReconnectConfig } from './redis.interface.js';

@Injectable()
export class RedisConfigService {
  private readonly redis: RedisConfig;

  constructor(config: ConfigService) {
    this.redis = config.getOrThrow<RedisConfig>('redis');
  }

  get url(): string {
    return this.redis.url;
  }

  get tls(): RedisConfig['tls'] {
    return this.redis.tls;
  }

  get keyPrefix(): string {
    return this.redis.keyPrefix;
  }

  get connectTimeoutMs(): number {
    return this.redis.connectTimeoutMs;
  }

  get commandTimeoutMs(): number {
    return this.redis.commandTimeoutMs;
  }

  get maxRetriesPerRequest(): number {
    return this.redis.maxRetriesPerRequest;
  }

  get reconnect(): RedisReconnectConfig {
    return this.redis.reconnect;
  }
}
