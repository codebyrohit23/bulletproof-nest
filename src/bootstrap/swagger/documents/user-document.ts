import { DocumentBuilder } from '@nestjs/swagger';

import { ApiVersion } from '#/shared/constants/index.js';

import { SWAGGER_SECURITY, USER_API_TAGS } from '../swagger.constants.js';

/**
 * The public API — consumed by the mobile and web apps.
 *
 * Versioned, because these clients are not deployed with the backend: a phone
 * can be running a build from six months ago.
 */
export function buildUserDocumentConfig() {
  const builder = new DocumentBuilder()
    .setTitle('LeadFlow API')
    .setDescription('Public API for the LeadFlow web and mobile applications.')
    .setVersion(ApiVersion.V1)
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, SWAGGER_SECURITY.USER);

  /*
   * No `addServer()`. Nest bakes the global prefix and version into the paths
   * it generates, so a server URL of `/api/v1` would make Swagger UI request
   * `/api/v1/api/v1/leads`. Paths are absolute; the server is the origin.
   */

  /*
   * Order matters — Swagger UI renders the sidebar in the order tags are added.
   */
  for (const tag of USER_API_TAGS) {
    builder.addTag(tag.name, tag.description);
  }

  return builder.build();
}
