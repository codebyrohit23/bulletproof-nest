import { Injectable } from '@nestjs/common';
import { type HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

import { REDIS_HEALTH_KEY } from '../constants/redis.constants.js';
import { RedisService } from '../redis.service.js'; // value import — required for DI metadata

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly redis: RedisService,

    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  /**
   * Reports Redis status without ever throwing.
   *
   * A `down` result here should feed **readiness**, never liveness. Restarting
   * a pod does not fix an unreachable Redis, and wiring this to liveness turns
   * a cache outage into a full restart loop across every replica.
   */
  async isHealthy(key: string = REDIS_HEALTH_KEY): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const startedAt = Date.now();

    try {
      await this.redis.isHealthy();

      return indicator.up({ responseTimeMs: Date.now() - startedAt });
    } catch (error) {
      return indicator.down({
        responseTimeMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : 'Redis probe failed',
      });
    }
  }
}
