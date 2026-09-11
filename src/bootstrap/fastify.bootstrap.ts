import compress from '@fastify/compress';
import cookie from '@fastify/cookie';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { SecurityConfigService } from '#/config/security/index.js';

/**
 * Registers Fastify-specific plugins.
 *
 * Plugins registered against a built adapter. Adapter *options* — `trustProxy`,
 * `bodyLimit`, `genReqId` — cannot be set from here: by the time this runs the
 * adapter already exists, so they belong in `main.ts`.
 *
 * ---------------------------------------------------------------------------
 * PLANNED
 * ---------------------------------------------------------------------------
 *   @fastify/multipart       WITH the first upload endpoint
 *     Avatars and CSV import are the two that will need it. Registering it
 *     earlier means every request pays for a parser nothing uses.
 *
 *   @fastify/static          ONLY IF this service serves assets itself
 *     It currently serves JSON and nothing else; a CDN or the web app's own
 *     host is the usual answer. Do not add it speculatively.
 *
 *   useWebSocketAdapter()    WITH the first realtime feature
 *     Not a plugin — an application-level call, so it would go in
 *     `app.bootstrap.ts` rather than here.
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
