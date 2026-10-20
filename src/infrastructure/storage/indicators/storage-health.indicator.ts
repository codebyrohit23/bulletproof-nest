import { Injectable } from '@nestjs/common';
import { type HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

import { withTimeout } from '#/shared/utils/index.js';

import { STORAGE_HEALTH_KEY, STORAGE_HEALTH_TIMEOUT_MS } from '../constants/index.js';
import { ObjectStorageService } from '../object-storage.service.js';
import { describeStorageError } from '../utils/index.js';

@Injectable()
export class StorageHealthIndicator {
  constructor(
    private readonly storage: ObjectStorageService,

    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

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
        message: describeStorageError(error),
      });
    }
  }
}
