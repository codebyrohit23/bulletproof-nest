import { DocumentBuilder } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

import {
  ADMIN_API_TAGS,
  API_AUDIENCE,
  ApiVersion,
  USER_API_TAGS,
} from '#/shared/constants/index.js';
import { resolveApiAudience } from '#/shared/utils/index.js';

import type { ApiAudience } from '../interfaces/index.js';

import { DOCS_PATH, SECURITY_SCHEME } from './openapi.constants.js';
import { BEARER_SECURITY_SCHEME } from './openapi.security.js';

export const API_AUDIENCES: readonly ApiAudience[] = [
  {
    key: API_AUDIENCE.USER,
    title: 'LeadFlow API',
    description: 'Public API for the LeadFlow web and mobile applications.',
    version: ApiVersion.V1,
    securityScheme: SECURITY_SCHEME.USER,
    docsPath: DOCS_PATH.USER,
    specPath: DOCS_PATH.USER_SPEC,
    tags: USER_API_TAGS,

    includesPath: (path) => resolveApiAudience(path) === API_AUDIENCE.USER,
  },
  {
    key: API_AUDIENCE.ADMIN,
    title: 'LeadFlow Admin API',
    description: 'Internal API for the LeadFlow admin console. Not for public use.',
    version: ApiVersion.V1,
    securityScheme: SECURITY_SCHEME.ADMIN,
    docsPath: DOCS_PATH.ADMIN,
    specPath: DOCS_PATH.ADMIN_SPEC,
    tags: ADMIN_API_TAGS,

    includesPath: (path) => resolveApiAudience(path) === API_AUDIENCE.ADMIN,
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
