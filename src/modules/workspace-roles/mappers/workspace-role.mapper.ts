import type { WorkspaceRole } from '../dto/index.js';
import type { WorkspaceRoleRow } from '../repositories/index.js';

export function toWorkspaceRole(
  row: WorkspaceRoleRow,
  view: { permissions: readonly string[]; memberCount: number; editable: boolean },
): WorkspaceRole {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    isSystem: row.isSystem,
    editable: view.editable,
    permissions: [...view.permissions].sort(),
    memberCount: view.memberCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
