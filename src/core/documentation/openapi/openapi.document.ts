import type { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import type { ApiAudience } from '../interfaces/index.js';

import { API_AUDIENCES, buildDocumentConfig } from './openapi.config.js';
import { SCHEMA_REF_PREFIX } from './openapi.constants.js';

export function buildApiDocuments(app: INestApplication): Map<ApiAudience, OpenAPIObject> {
  const generated = cleanupOpenApiDoc(
    SwaggerModule.createDocument(app, buildDocumentConfig(API_AUDIENCES[0]!)),
  );

  return new Map(
    API_AUDIENCES.map((audience) => [
      audience,
      pruneUnusedTags(pruneUnusedSchemas(sliceForAudience(generated, audience))),
    ]),
  );
}

function sliceForAudience(document: OpenAPIObject, audience: ApiAudience): OpenAPIObject {
  const config = buildDocumentConfig(audience);

  return {
    ...filterPaths(document, audience.includesPath),
    ...config,
    components: {
      ...document.components,
      ...config.components,
    },
  };
}

export function filterPaths(
  document: OpenAPIObject,
  predicate: (path: string) => boolean,
): OpenAPIObject {
  return {
    ...document,
    paths: Object.fromEntries(Object.entries(document.paths).filter(([path]) => predicate(path))),
  };
}

export function pruneUnusedSchemas(document: OpenAPIObject): OpenAPIObject {
  const schemas = document.components?.schemas;

  if (schemas === undefined) {
    return document;
  }

  const reachable = new Set<string>();
  const pending = collectSchemaRefs(document.paths);

  while (pending.length > 0) {
    const name = pending.pop()!;

    if (reachable.has(name) || !(name in schemas)) {
      continue;
    }

    reachable.add(name);
    pending.push(...collectSchemaRefs(schemas[name]));
  }

  return {
    ...document,
    components: {
      ...document.components,
      schemas: Object.fromEntries(Object.entries(schemas).filter(([name]) => reachable.has(name))),
    },
  };
}

function collectSchemaRefs(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectSchemaRefs);
  }

  if (typeof value !== 'object' || value === null) {
    return [];
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    if (key === '$ref' && typeof nested === 'string' && nested.startsWith(SCHEMA_REF_PREFIX)) {
      return [nested.slice(SCHEMA_REF_PREFIX.length)];
    }

    return collectSchemaRefs(nested);
  });
}

export function pruneUnusedTags(document: OpenAPIObject): OpenAPIObject {
  const used = new Set<string>();

  for (const pathItem of Object.values(document.paths)) {
    for (const operation of Object.values(pathItem)) {
      if (typeof operation !== 'object' || operation === null || !('tags' in operation)) {
        continue;
      }

      for (const tag of (operation as { tags?: string[] }).tags ?? []) {
        used.add(tag);
      }
    }
  }

  return { ...document, tags: (document.tags ?? []).filter((tag) => used.has(tag.name)) };
}
