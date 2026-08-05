import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { HealthController } from './controllers/health.controller.js';

/**
 * The first module in `modules/` — and a demonstration of the boundary.
 *
 * It owns a route, so it lives here rather than in `core/`. It owns no
 * indicators: `PrismaHealthIndicator` and `RedisHealthIndicator` live with the
 * infrastructure they probe, because only that module knows what "healthy"
 * means for its own connection. This module only decides which probes make up
 * *readiness* and exposes them over HTTP.
 *
 * That is why adding a dependency later — mail, storage — means writing an
 * indicator in *that* infrastructure module and adding one line here.
 *
 * `TerminusModule` supplies `HealthCheckService`. The indicators arrive through
 * their own `@Global()` modules.
 */
@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
