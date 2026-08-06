import type { OpenAPIObject } from '@nestjs/swagger';

/**
 * Pure helpers for slicing one generated document into two.
 */

/**
 * Returns a copy of `document` keeping only paths that satisfy `predicate`.
 *
 * Both audiences are produced from a **single** generation pass and filtered,
 * rather than generated twice. Two passes would eventually disagree — a
 * decorator added in one place, a schema registered in the other.
 *
 * Nest's own `include` option cannot do this: it filters by module, and a
 * module holds both its user and its admin controller.
 */
export function filterDocumentPaths(document: OpenAPIObject, predicate: (path: string) => boolean): OpenAPIObject {
  const paths = Object.fromEntries(Object.entries(document.paths).filter(([path]) => predicate(path)));

  return { ...document, paths };
}

/**
 * Drops tags that no surviving path references.
 *
 * Without this, the admin document lists every user-facing tag in its sidebar
 * with nothing under them — which is worse than no grouping at all.
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
