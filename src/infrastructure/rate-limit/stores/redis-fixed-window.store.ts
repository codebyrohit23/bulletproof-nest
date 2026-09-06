import { Injectable } from '@nestjs/common';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';

import { RedisService } from '#/infrastructure/redis/index.js';

import {
  RATE_LIMIT_MS_PER_SECOND,
  RATE_LIMIT_POINTS_PER_HIT,
  RATE_LIMIT_STORE_KEY_PREFIX,
} from '../constants/index.js';
import { RateLimitStore, type RateLimitWindow } from '../interfaces/index.js';
import { toWindow } from '../utils/index.js';

@Injectable()
export class RedisFixedWindowStore extends RateLimitStore {
  private readonly limiters = new Map<string, RateLimiterRedis>();

  constructor(private readonly redis: RedisService) {
    super();
  }

  async consume(key: string, limit: number, windowMs: number): Promise<RateLimitWindow> {
    const limiter = this.limiterFor(limit, windowMs);

    try {
      const result = await limiter.consume(key, RATE_LIMIT_POINTS_PER_HIT);

      return toWindow(true, result);
    } catch (rejection) {
      if (rejection instanceof RateLimiterRes) {
        return toWindow(false, rejection);
      }

      throw rejection;
    }
  }

  async peek(key: string, limit: number, windowMs: number): Promise<RateLimitWindow> {
    const result = await this.limiterFor(limit, windowMs).get(key);

    if (result === null) {
      return { allowed: true, remaining: limit, resetInMs: 0 };
    }

    return toWindow(result.remainingPoints > 0, result);
  }

  async refund(key: string, limit: number, windowMs: number): Promise<void> {
    await this.limiterFor(limit, windowMs).reward(key, RATE_LIMIT_POINTS_PER_HIT);
  }

  private limiterFor(limit: number, windowMs: number): RateLimiterRedis {
    const shape = `${limit}:${windowMs}`;
    const existing = this.limiters.get(shape);

    if (existing !== undefined) {
      return existing;
    }

    const limiter = new RateLimiterRedis({
      storeClient: this.redis.client,

      keyPrefix: RATE_LIMIT_STORE_KEY_PREFIX,

      points: limit,

      duration: Math.max(1, Math.ceil(windowMs / RATE_LIMIT_MS_PER_SECOND)),
    });

    this.limiters.set(shape, limiter);

    return limiter;
  }
}
