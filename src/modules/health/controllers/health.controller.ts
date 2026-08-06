import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus';

import { RawResponse } from '#/core/interceptors/index.js';
import { PrismaHealthIndicator } from '#/infrastructure/database/prisma/index.js';
import { RedisHealthIndicator } from '#/infrastructure/redis/index.js';

import { HEALTH_API_TAG } from '../constants/health.constants.js';
import type { LivenessResult } from '../interfaces/index.js';

@ApiTags(HEALTH_API_TAG.name)
@Controller({ path: 'health', version: VERSION_NEUTRAL })
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
  @ApiOperation({ summary: 'Liveness — is the process running?' })
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
  @ApiOperation({ summary: 'Readiness — can it serve traffic? Checks Postgres and Redis.' })
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
  @ApiOperation({ summary: 'Readiness, at the conventional default path.' })
  @RawResponse()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.ready();
  }
}
