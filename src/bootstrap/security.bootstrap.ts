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
 * Future:
 * - Rate limiting
 * - CSRF protection
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
