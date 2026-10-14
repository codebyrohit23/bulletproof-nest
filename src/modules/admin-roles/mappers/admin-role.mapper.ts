import type { AdminRole } from '../dto/index.js';
import type { AdminRoleRow } from '../repositories/index.js';

export function toAdminRole(
  row: AdminRoleRow,
  permissions: readonly string[],
  adminCount: number,
): AdminRole {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    permissions: [...permissions].sort(),
    adminCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
