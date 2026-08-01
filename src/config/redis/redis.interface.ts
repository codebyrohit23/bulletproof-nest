import type { ConnectionOptions } from 'node:tls';

export interface RedisConfig {
  readonly url: string;

  readonly tls?: ConnectionOptions;

  readonly keyPrefix: string;

  readonly connectTimeoutMs: number;

  readonly commandTimeoutMs: number;

  readonly maxRetriesPerRequest: number;

  readonly reconnect: RedisReconnectConfig;
}

export interface RedisReconnectConfig {
  readonly maxAttempts: number;

  readonly baseDelayMs: number;

  readonly maxDelayMs: number;
}
