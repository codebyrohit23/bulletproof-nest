import { DocumentBuilder } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

import { ApiVersion } from '#/shared/constants/index.js';

import type { ApiAudience } from '../documentation.types.js';

import { ADMIN_PATH_SEGMENT, DOCS_PATH, SECURITY_SCHEME } from './openapi.constants.js';
import { BEARER_SECURITY_SCHEME } from './openapi.security.js';
import { ADMIN_API_TAGS, USER_API_TAGS } from './openapi.tags.js';

/**
 * Every published surface, in the order they are mounted.
 *
 * One array, and the rest of the module iterates it. Adding a surface is an
 * entry here — no second loop to find, no `if (audience === 'admin')` hiding in
 * a renderer.
 */
export const API_AUDIENCES: readonly ApiAudience[] = [
  {
    key: 'user',
    title: 'LeadFlow API',
    description: 'Public API for the LeadFlow web and mobile applications.',
    version: ApiVersion.V1,
    securityScheme: SECURITY_SCHEME.USER,
    docsPath: DOCS_PATH.USER,
    specPath: DOCS_PATH.USER_SPEC,
    tags: USER_API_TAGS,

    /*
     * Defined by exclusion, deliberately. "Everything that is not an admin
     * route" fails safe: a new module that forgets to register anywhere shows
     * up in the public reference, which someone notices. The inverse rule
     * would silently publish it to nobody.
     */
    includesPath: (path) => !path.includes(ADMIN_PATH_SEGMENT),
  },
  {
    key: 'admin',
    title: 'LeadFlow Admin API',
    description: 'Internal API for the LeadFlow admin console. Not for public use.',

    /*
     * Unversioned on purpose. Versioning exists so clients you do not control
     * can lag behind; the admin console ships with the backend, so a version
     * segment would be ceremony with no consumer. Admin controllers use
     * `VERSION_NEUTRAL`, so one of them can still take `@Version('2')` later
     * while the rest continue serving as the implicit v1.
     */
    version: 'unversioned',
    securityScheme: SECURITY_SCHEME.ADMIN,
    docsPath: DOCS_PATH.ADMIN,
    specPath: DOCS_PATH.ADMIN_SPEC,
    tags: ADMIN_API_TAGS,
    includesPath: (path) => path.includes(ADMIN_PATH_SEGMENT),
  },
];

/**
 * Turns an audience into the `info` and `components` half of its document.
 *
 * Note the absence of `addServer()`. Nest bakes the global prefix and the
 * version into the paths it generates, so declaring a server of `/api/v1` makes
 * the reference request `/api/v1/api/v1/leads`. The paths are absolute; the
 * server is the origin, and the origin is where the page is already served
 * from.
 */
export function buildDocumentConfig(audience: ApiAudience): Omit<OpenAPIObject, 'paths'> {
  const builder = new DocumentBuilder()
    .setTitle(audience.title)
    .setDescription(audience.description)
    .setVersion(audience.version)
    .addBearerAuth(BEARER_SECURITY_SCHEME, audience.securityScheme);

  for (const tag of audience.tags) {
    builder.addTag(tag.name, tag.description);
  }

  return builder.build();
}
