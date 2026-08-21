import type { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

import type { ApiAudience } from '../documentation.types.js';

import { API_AUDIENCES, buildDocumentConfig } from './openapi.config.js';
import { SCHEMA_REF_PREFIX } from './openapi.constants.js';

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

/**
 * Narrows the generated document to one surface and stamps that surface's
 * identity onto it.
 *
 * `components` is merged rather than overwritten, and that is the whole reason
 * this function exists rather than being two spreads at the call site.
 * `buildDocumentConfig` returns a `components` containing only the audience's
 * bearer scheme, so spreading it over the generated document replaced every
 * generated `components.schemas` entry with nothing — leaving each `$ref` in
 * the paths pointing at a component that no longer existed. Scalar renders a
 * dangling `$ref` as an empty box, so the reference looked merely sparse rather
 * than broken.
 */
function sliceForAudience(document: OpenAPIObject, audience: ApiAudience): OpenAPIObject {
  const config = buildDocumentConfig(audience);

  return {
    ...filterPaths(document, audience.includesPath),
    ...config,

    components: {
      ...document.components,

      /*
       * Last, so the audience's own scheme wins. Every document is generated
       * against the first audience's scheme, and an admin reference asking for
       * a user token would send an operator round a loop they cannot escape.
       */
      ...config.components,
    },
  };
}

/**
 * Keeps only the paths belonging to one audience.
 *
 * Pure and exported so the slicing rule can be exercised directly, without
 * standing up an application to generate a document first.
 */
export function filterPaths(
  document: OpenAPIObject,
  predicate: (path: string) => boolean,
): OpenAPIObject {
  return {
    ...document,
    paths: Object.fromEntries(Object.entries(document.paths).filter(([path]) => predicate(path))),
  };
}

/**
 * Drops schemas no surviving path can reach.
 *
 * Not housekeeping — it is the second half of the audience split. The paths are
 * filtered, but every DTO from every controller lands in one shared
 * `components.schemas`, so without this the public reference would still ship
 * the full field list of every admin payload. The document split exists
 * precisely to stop that, and filtering paths alone does not achieve it.
 *
 * Reachability is transitive: a surviving schema's own `$ref`s are followed, so
 * a response DTO keeps the nested DTOs it composes.
 */
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

/**
 * Every `#/components/schemas/…` name appearing anywhere inside a value.
 *
 * A generic deep walk rather than a targeted read of `content.schema`, because
 * a `$ref` can appear at any depth — nested under `allOf`, inside `items`, or
 * under a property of a property. Missing one would silently prune a schema
 * that is genuinely in use.
 */
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
