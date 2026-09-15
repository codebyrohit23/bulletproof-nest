import { Controller, Get, Optional, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  type HealthCheckResult,
  type HealthIndicatorFunction,
} from '@nestjs/terminus';

import { Public } from '#/core/auth/index.js';
import { RawResponse } from '#/core/interceptors/index.js';
import { SkipRateLimit } from '#/core/rate-limit/index.js';
import { PrismaHealthIndicator } from '#/infrastructure/database/prisma/index.js';
import { QueueHealthIndicator, WorkerHealthIndicator } from '#/infrastructure/queue/index.js';
import { RedisHealthIndicator } from '#/infrastructure/redis/index.js';
import { HEALTH_API_TAG } from '#/shared/constants/index.js';

import type { LivenessResult } from '../interfaces/index.js';

@Public()
@SkipRateLimit()
@ApiTags(HEALTH_API_TAG.name)
@Controller({ path: '', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,

    private readonly prisma: PrismaHealthIndicator,

    private readonly redis: RedisHealthIndicator,

    private readonly queue: QueueHealthIndicator,

    /** Absent in a process that runs no workers; its check then drops out on its own. */
    @Optional() private readonly workers?: WorkerHealthIndicator,
  ) {}

  @Get('health/live')
  @ApiOperation({ summary: 'Liveness — is the process running?' })
  @RawResponse()
  live(): LivenessResult {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/ready')
  @ApiOperation({
    summary: 'Readiness — can it serve traffic? Checks Postgres, Redis, the queue and its workers.',
  })
  @RawResponse()
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    const checks: HealthIndicatorFunction[] = [
      () => this.prisma.isHealthy(),
      () => this.redis.isHealthy(),
      () => this.queue.isHealthy(),
    ];

    const workers = this.workers;

    if (workers !== undefined) {
      checks.push(() => workers.isHealthy());
    }

    return this.health.check(checks);
  }

  @Get('health')
  @ApiOperation({ summary: 'Readiness, at the conventional default path.' })
  @RawResponse()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.ready();
  }

  @Get('health')
  @ApiOperation({ summary: 'Check application readiness' })
  @RawResponse()
  @HealthCheck()
  checkReadiness(): Promise<HealthCheckResult> {
    return this.ready();
  }

  @Get()
  @ApiOperation({ summary: 'Get API information' })
  @RawResponse()
  getRoot() {
    return {
      success: true,
      message: 'LeadFlow API is running',
    };
  }
}
