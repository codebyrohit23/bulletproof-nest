import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus';

import { RawResponse } from '@/core/interceptors/index.js';
import { PrismaHealthIndicator } from '@/infrastructure/database/prisma/index.js'; // value import — required for DI metadata
import { RedisHealthIndicator } from '@/infrastructure/redis/index.js'; // value import — required for DI metadata

import type { LivenessResult } from '../interfaces/index.js';

/**
 * Liveness and readiness, deliberately separate.
 *
 * They answer different questions and an orchestrator reacts to them
 * differently — conflating them is the single most common way a health check
 * turns a small problem into an outage.
 *
 * Routes sit at `/health`, not `/api/v1/health`: `versioning.bootstrap.ts`
 * excludes them from the global prefix so probes never break when the API is
 * versioned.
 */
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,

    private readonly prisma: PrismaHealthIndicator,

    private readonly redis: RedisHealthIndicator,
  ) {}

  /**
   * "Is this process alive?"
   *
   * **Checks nothing external, on purpose.** A failing liveness probe tells the
   * orchestrator to *restart the container* — and restarting will not fix an
   * unreachable database. Wire Postgres into liveness and a thirty-second
   * database blip becomes every replica restarting at once, which is a far
   * worse outage than the blip.
   *
   * If this endpoint can reply at all, the event loop is turning and the answer
   * is yes.
   */
  @Get('live')
  @RawResponse()
  live(): LivenessResult {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * "Can this process serve traffic?"
   *
   * A failure here should remove the instance from the load balancer and leave
   * it running — it will recover on its own when its dependencies do.
   */
  @Get('ready')
  @RawResponse()
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    return this.health.check([() => this.prisma.isHealthy(), () => this.redis.isHealthy()]);
  }

  /**
   * The conventional default endpoint, for uptime monitors and humans. Same
   * checks as readiness.
   */
  @Get()
  @RawResponse()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.ready();
  }
}
