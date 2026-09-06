import { DocumentBuilder } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

import { ApiVersion } from '#/shared/constants/index.js';

import type { ApiAudience } from '../interfaces/index.js';

import { ADMIN_PATH_SEGMENT, DOCS_PATH, SECURITY_SCHEME } from './openapi.constants.js';
import { BEARER_SECURITY_SCHEME } from './openapi.security.js';
import { ADMIN_API_TAGS, USER_API_TAGS } from './openapi.tags.js';

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

    includesPath: (path) => !path.includes(ADMIN_PATH_SEGMENT),
  },
  {
    key: 'admin',
    title: 'LeadFlow Admin API',
    description: 'Internal API for the LeadFlow admin console. Not for public use.',
    version: 'unversioned',
    securityScheme: SECURITY_SCHEME.ADMIN,
    docsPath: DOCS_PATH.ADMIN,
    specPath: DOCS_PATH.ADMIN_SPEC,
    tags: ADMIN_API_TAGS,
    includesPath: (path) => path.includes(ADMIN_PATH_SEGMENT),
  },
];

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
