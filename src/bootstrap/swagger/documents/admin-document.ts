import { DocumentBuilder } from '@nestjs/swagger';

import { ADMIN_API_TAGS, SWAGGER_SECURITY } from '../swagger.constants.js';

/**
 * The admin API — consumed only by the first-party admin web application.
 *
 * **Deliberately unversioned.** Versioning exists so clients you do not control
 * can lag behind; the admin app ships with the backend, so a version segment
 * would be ceremony with no consumer.
 *
 * The door stays open: admin controllers use `VERSION_NEUTRAL`, so a single
 * controller can later take `@Version('2')` while everything unversioned
 * continues to serve as the implicit v1.
 *
 * The one real risk of no versioning is a browser holding a stale SPA build.
 * That is handled by keeping changes additive and having the client compare a
 * build header, not by putting a number in the URL.
 */
export function buildAdminDocumentConfig() {
  const builder = new DocumentBuilder()
    .setTitle('LeadFlow Admin API')
    .setDescription('Internal API for the LeadFlow admin console. Not for public use.')
    .setVersion('unversioned')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, SWAGGER_SECURITY.ADMIN);

  /*
   * No `addServer()` — see the note in `user-document.ts`. Nest's generated
   * paths already carry the `/api` prefix.
   */

  for (const tag of ADMIN_API_TAGS) {
    builder.addTag(tag.name, tag.description);
  }

  return builder.build();
}
