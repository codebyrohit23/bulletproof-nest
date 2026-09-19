import { Injectable } from '@nestjs/common';
import { type HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

import { withTimeout } from '#/shared/utils/index.js';

import { QUEUE_HEALTH_TIMEOUT_MS } from '../../constants/queue.constants.js';
import { OUTBOX_HEALTH_KEY } from '../constants/index.js';
import { OutboxRepository } from '../repositories/index.js';

@Injectable()
export class OutboxHealthIndicator {
  constructor(
    private readonly outbox: OutboxRepository,

    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string = OUTBOX_HEALTH_KEY): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      const backlog = await withTimeout(
        this.outbox.backlog(),
        QUEUE_HEALTH_TIMEOUT_MS,
        'Outbox backlog check',
      );

      return indicator.up({ ...backlog });
    } catch (error) {
      return indicator.up({
        available: false,
        message: error instanceof Error ? error.message : 'Outbox backlog unavailable',
      });
    }
  }
}
