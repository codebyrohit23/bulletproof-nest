import type { PermissionEntry } from '#/core/permissions/index.js';

import type { WorkspacePermissionCatalogue } from '../dto/index.js';

export function toPermissionCatalogueItem(
  entry: PermissionEntry<string, string>,
): WorkspacePermissionCatalogue['items'][number] {
  return {
    key: entry.key,
    resource: entry.resource,
    action: entry.action,
    name: entry.name,
    description: entry.description,
    restricted: entry.restricted,
  };
}
