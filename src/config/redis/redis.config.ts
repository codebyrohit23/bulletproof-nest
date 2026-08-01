import { registerAs } from '@nestjs/config';

import { env } from '../shared/env.js';

import type { RedisConfig } from './redis.interface.js';

export const redisConfig = registerAs('redis', (): RedisConfig => ({
  url: env.REDIS_URL,

  /*
   * Conditional rather than `tls: undefined`, because `exactOptionalPropertyTypes`
   * treats an explicitly-undefined optional property as a type error — and
   * because ioredis checks for the key's presence, not its value.
   */
  ...(env.REDIS_TLS ? { tls: {} } : {}),

  keyPrefix: env.REDIS_KEY_PREFIX,

  connectTimeoutMs: env.REDIS_CONNECT_TIMEOUT_MS,

  commandTimeoutMs: env.REDIS_COMMAND_TIMEOUT_MS,

  maxRetriesPerRequest: env.REDIS_MAX_RETRIES_PER_REQUEST,

  reconnect: {
    maxAttempts: env.REDIS_RECONNECT_MAX_ATTEMPTS,

    baseDelayMs: env.REDIS_RECONNECT_BASE_DELAY_MS,

    maxDelayMs: env.REDIS_RECONNECT_MAX_DELAY_MS,
  },
}));
