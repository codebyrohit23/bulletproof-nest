import compress from '@fastify/compress';
import cookie from '@fastify/cookie';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { SecurityConfigService } from '#/config/security/index.js';

/**
 * Registers Fastify-specific plugins.
 *
 * Future:
 * - Multipart
 * - Static assets
 * - Trust proxy
 * - WebSocket adapter
 */
export async function configureFastify(app: NestFastifyApplication): Promise<void> {
  const securityConfig = app.get(SecurityConfigService);
  // Cookie support (refresh tokens, sessions)
  await app.register(cookie, {
    secret: securityConfig.cookie.secret,
  });

  // Response compression (gzip, brotli)
  await app.register(compress);
}
