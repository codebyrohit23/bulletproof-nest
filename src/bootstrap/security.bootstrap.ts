import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import {
  DEFAULT_CORS_OPTIONS,
  HELMET_OPTIONS,
  SecurityConfigService,
} from '#/config/security/index.js';

/**
 * Registers application security middleware.
 *
 * Plugins only. Rate limiting is **not** missing from this file — it is
 * `RateLimitGuard`, bound as an `APP_GUARD` in `core/rate-limit`, because it
 * reads per-route `@RateLimit()` metadata and injects a Redis-backed store.
 * A Fastify plugin runs before routing and can do neither.
 *
 * ---------------------------------------------------------------------------
 * PLANNED
 * ---------------------------------------------------------------------------
 *   @fastify/csrf-protection        WITH a cross-domain web client
 *     Genuinely absent. The refresh cookie is defended today by
 *     `sameSite: 'lax'`, which holds only while the web client shares a
 *     registrable domain with this API — see `CookieConfig.sameSite`. Moving
 *     the client to its own domain forces `sameSite: 'none'`, and that is the
 *     moment this becomes required rather than optional.
 *
 *     `CSRF_ENABLED` is a flag with nothing behind it until then.
 */
export async function configureSecurity(app: NestFastifyApplication): Promise<void> {
  const securityConfig = app.get(SecurityConfigService);

  await app.register(helmet, HELMET_OPTIONS);

  if (securityConfig.cors.enabled) {
    await app.register(cors, {
      ...DEFAULT_CORS_OPTIONS,
      origin: securityConfig.cors.origin,
      credentials: securityConfig.cors.credentials,
    });
  }
}
