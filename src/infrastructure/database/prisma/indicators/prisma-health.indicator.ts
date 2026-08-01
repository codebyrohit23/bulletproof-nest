import { Injectable } from '@nestjs/common';
import { type HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

import { HEALTH_CHECK_TIMEOUT_MS, PRISMA_HEALTH_KEY } from '../constants/prisma.constants.js';
import { PrismaService } from '../prisma.service.js'; // value import — required for DI metadata

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
      await this.withTimeout(this.prisma.isHealthy(), HEALTH_CHECK_TIMEOUT_MS);

      return indicator.up({ responseTimeMs: Date.now() - startedAt });
    } catch (error) {
      return indicator.down({
        responseTimeMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : 'Database probe failed',
      });
    }
  }

  /**
   * The timer is always cleared. An uncleared `setTimeout` inside `Promise.race`
   * leaks a handle on every probe, and orchestrators call this every few seconds.
   */
  private async withTimeout<T>(operation: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: NodeJS.Timeout | undefined;

    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Database health check timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([operation, timeout]);
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    }
  }
}
