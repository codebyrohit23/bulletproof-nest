import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { type HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import type { Queue } from 'bullmq';

import { withTimeout } from '#/shared/utils/index.js';

import { QUEUE, QUEUE_HEALTH_KEY, QUEUE_HEALTH_TIMEOUT_MS } from '../constants/queue.constants.js';

@Injectable()
export class QueueHealthIndicator {
  constructor(
    @InjectQueue(QUEUE.EMAIL) private readonly email: Queue,

    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string = QUEUE_HEALTH_KEY): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const startedAt = Date.now();

    try {
      const counts = await withTimeout(
        this.email.getJobCounts('waiting', 'active', 'failed'),
        QUEUE_HEALTH_TIMEOUT_MS,
        'Queue health check',
      );

      return indicator.up({
        responseTimeMs: Date.now() - startedAt,
        queue: QUEUE.EMAIL,
        ...counts,
      });
    } catch (error) {
      return indicator.down({
        responseTimeMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : 'Queue probe failed',
      });
    }
  }
}
