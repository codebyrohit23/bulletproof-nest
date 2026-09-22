import { Injectable } from '@nestjs/common';
import { type HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

import { withTimeout } from '#/shared/utils/index.js';

import { HEALTH_CHECK_TIMEOUT_MS, PRISMA_HEALTH_KEY } from '../constants/index.js';
import { PrismaService } from '../prisma.service.js';

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly prisma: PrismaService,

    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string = PRISMA_HEALTH_KEY): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const startedAt = Date.now();

    try {
      await withTimeout(this.prisma.isHealthy(), HEALTH_CHECK_TIMEOUT_MS, 'Database health check');

      return indicator.up({ responseTimeMs: Date.now() - startedAt });
    } catch (error) {
      return indicator.down({
        responseTimeMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : 'Database probe failed',
      });
    }
  }
}
