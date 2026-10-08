import { Injectable } from '@nestjs/common';

import { WORKSPACE_PERMISSION_CATALOGUE } from '#/core/permissions/index.js';

import type { WorkspaceRoleSummary } from '../interfaces/index.js';
import { WorkspaceRoleRepository } from '../repositories/index.js';

const DEFAULT_ROLE_ORDER: readonly string[] = WORKSPACE_PERMISSION_CATALOGUE.defaultRoles;

/**
 * Roles as clients see them. Not on the guard's path — the guard needs only
 * what roles grant — so it reads the database directly, without a cache.
 */
@Injectable()
export class WorkspaceRoleService {
  constructor(private readonly roleRepo: WorkspaceRoleRepository) {}

  /** Default roles first, in catalogue order, then custom roles by name. */
  async findSummaries(roleIds: readonly string[]): Promise<WorkspaceRoleSummary[]> {
    const roles = await this.roleRepo.findSummaries(roleIds);

    return roles.sort(compareRoles);
  }
}

function compareRoles(a: WorkspaceRoleSummary, b: WorkspaceRoleSummary): number {
  if (a.isSystem !== b.isSystem) {
    return a.isSystem ? -1 : 1;
  }

  if (a.isSystem) {
    return DEFAULT_ROLE_ORDER.indexOf(a.key ?? '') - DEFAULT_ROLE_ORDER.indexOf(b.key ?? '');
  }

  return a.name.localeCompare(b.name);
}
