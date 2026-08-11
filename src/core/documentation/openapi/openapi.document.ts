import type { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import type { ApiAudience } from '../documentation.types.js';

import { API_AUDIENCES, buildDocumentConfig } from './openapi.config.js';

/**
 * Builds one document per audience from a **single** generation pass.
 *
 * Generating twice would eventually produce two documents that disagree — a
 * decorator added on one pass, a schema registered on the other — and the
 * disagreement would be invisible, because nobody reads both references side by
 * side. Generating once and slicing makes divergence impossible rather than
 * unlikely.
 *
 * Nest's own `include` option cannot do this. It filters by *module*, and every
 * feature module here owns both its user controller and its admin controller.
 */
export function buildApiDocuments(app: INestApplication): Map<ApiAudience, OpenAPIObject> {
  /*
   * `cleanupOpenApiDoc` is not optional. DTOs are Zod schemas through
   * `createZodDto`, which `@nestjs/swagger` does not understand — without this
   * pass every request body renders as an empty object, and the reference looks
   * complete while documenting nothing.
   */
  const generated = cleanupOpenApiDoc(SwaggerModule.createDocument(app, buildDocumentConfig(API_AUDIENCES[0]!)));

  return new Map(
    API_AUDIENCES.map((audience) => [
      audience,
      pruneUnusedTags({
        ...filterPaths(generated, audience.includesPath),
        ...buildDocumentConfig(audience),
      }),
    ]),
  );
}

/**
 * Keeps only the paths belonging to one audience.
 *
 * Pure and exported so the slicing rule can be exercised directly, without
 * standing up an application to generate a document first.
 */
export function filterPaths(document: OpenAPIObject, predicate: (path: string) => boolean): OpenAPIObject {
  return {
    ...document,
    paths: Object.fromEntries(Object.entries(document.paths).filter(([path]) => predicate(path))),
  };
}

/**
 * Drops tags no surviving path references.
 *
 * Without it the admin reference lists every public tag in its sidebar with
 * nothing underneath — worse than no grouping, because an empty group reads as
 * a permissions problem rather than as an artefact of filtering.
 */
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
