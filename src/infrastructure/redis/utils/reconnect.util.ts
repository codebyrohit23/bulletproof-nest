import { REDIS_RECONNECT_UNLIMITED, type RedisReconnectConfig } from '#/config/redis/index.js';

import { REDIS_RECONNECT_JITTER_RATIO } from '../constants/redis.constants.js';

/**
 * Builds the function ioredis calls after a dropped connection.
 *
 * Returning a number is the delay before the next attempt; returning `null`
 * tells ioredis to stop reconnecting permanently.
 *
 * Pure — no client, no logger, no DI.
 */
export function createReconnectStrategy(config: RedisReconnectConfig): (attempt: number) => number | null {
  return (attempt: number): number | null => {
    if (config.maxAttempts !== REDIS_RECONNECT_UNLIMITED && attempt > config.maxAttempts) {
      return null;
    }

    return calculateReconnectDelay(attempt, config);
  };
}

/**
 * Exponential backoff clamped to `maxDelayMs`, with jitter either side.
 *
 * `attempt` is 1-based, so the first retry waits `baseDelayMs`.
 */
export function calculateReconnectDelay(attempt: number, config: RedisReconnectConfig): number {
  const exponential = config.baseDelayMs * 2 ** Math.max(0, attempt - 1);
  const clamped = Math.min(exponential, config.maxDelayMs);
  const jitter = clamped * REDIS_RECONNECT_JITTER_RATIO * (Math.random() * 2 - 1);

  return Math.max(0, Math.round(clamped + jitter));
}
