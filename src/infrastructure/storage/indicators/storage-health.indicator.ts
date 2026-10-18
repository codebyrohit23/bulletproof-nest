import { Injectable } from '@nestjs/common';
import { type HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

import { withTimeout } from '#/shared/utils/index.js';

import { STORAGE_HEALTH_KEY, STORAGE_HEALTH_TIMEOUT_MS } from '../constants/index.js';
import { ObjectStorageService } from '../object-storage.service.js';

@Injectable()
export class StorageHealthIndicator {
  constructor(
    private readonly storage: ObjectStorageService,

    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  /**
   * Reports storage, and never fails readiness — as for the outbox.
   *
   * Postgres and Redis are needed by every request; storage only by file
   * routes. Failing readiness on it would pull every pod from the load
   * balancer during an R2 incident and take sign-in down with uploads.
   */
  async isHealthy(key: string = STORAGE_HEALTH_KEY): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const startedAt = Date.now();

    try {
      await withTimeout(this.storage.probe(), STORAGE_HEALTH_TIMEOUT_MS, 'Storage probe');

      return indicator.up({ available: true, responseTimeMs: Date.now() - startedAt });
    } catch (error) {
      return indicator.up({
        available: false,
        responseTimeMs: Date.now() - startedAt,
        message: error instanceof Error ? error.message : 'Storage probe failed',
      });
    }
  }
}
