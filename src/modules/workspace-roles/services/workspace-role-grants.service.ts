import { Injectable } from '@nestjs/common';

import {
  WORKSPACE_PERMISSION_CATALOGUE,
  type WorkspaceDefaultRoleKey,
  type WorkspacePermissionKey,
} from '#/core/permissions/index.js';

import { WorkspaceMemberRolesCacheService } from '../cache/workspace-member-roles.cache.js';
import { WorkspaceRoleGrantsCacheService } from '../cache/workspace-role-grants.cache.js';
import type { WorkspaceRoleRef } from '../interfaces/index.js';
import { WorkspaceMemberRoleRepository, WorkspaceRoleRepository } from '../repositories/index.js';

const DEFAULT_ROLE_KEYS: ReadonlySet<string> = new Set(WORKSPACE_PERMISSION_CATALOGUE.defaultRoles);

/**
 * The permissions a set of roles grants — their union, for a member who holds
 * several. Two sources behind one call:
 *
 *   default role (key set)   the catalogue's `defaultsFor(key)`. No read: the
 *                            code is the source, and a deploy is the update.
 *   custom role (key null)   its grants from the cache by role id; on a miss,
 *                            one query for every missing role.
 *
 * Restricted keys are removed from every set read from the database: they
 * belong to the owner alone, and a row granting one to a role is a bug this
 * must not turn into access. `narrow` drops keys this build does not define.
 */
@Injectable()
export class WorkspaceRoleGrantsService {
  constructor(
    private readonly roleRepo: WorkspaceRoleRepository,
    private readonly memberRoleRepo: WorkspaceMemberRoleRepository,
    private readonly grantsCache: WorkspaceRoleGrantsCacheService,
    private readonly memberRolesCache: WorkspaceMemberRolesCacheService,
  ) {}

  /** The roles a member holds — cached per member. */
  async rolesOf(workspaceId: string, memberId: string): Promise<WorkspaceRoleRef[]> {
    return this.memberRolesCache.remember(workspaceId, memberId, () =>
      this.memberRoleRepo.findRoles(workspaceId, memberId),
    );
  }

  /** A default role's permissions — the catalogue's, never its rows. Empty for a key this build does not define. */
  defaultRolePermissions(key: string): ReadonlySet<WorkspacePermissionKey> {
    return DEFAULT_ROLE_KEYS.has(key)
      ? WORKSPACE_PERMISSION_CATALOGUE.defaultsFor(key as WorkspaceDefaultRoleKey)
      : new Set();
  }

  async permissionsOf(
    roles: readonly WorkspaceRoleRef[],
  ): Promise<ReadonlySet<WorkspacePermissionKey>> {
    const granted = new Set<WorkspacePermissionKey>();

    const customRoleIds: string[] = [];

    for (const role of roles) {
      if (role.key === null) {
        customRoleIds.push(role.id);
      } else if (DEFAULT_ROLE_KEYS.has(role.key)) {
        for (const key of WORKSPACE_PERMISSION_CATALOGUE.defaultsFor(
          role.key as WorkspaceDefaultRoleKey,
        )) {
          granted.add(key);
        }
      }
      /* A default role whose key this build no longer defines grants nothing. */
    }

    if (customRoleIds.length > 0) {
      for (const key of await this.customGrants(customRoleIds)) {
        if (!WORKSPACE_PERMISSION_CATALOGUE.restrictedKeys.has(key)) {
          granted.add(key);
        }
      }
    }

    return granted;
  }

  private async customGrants(
    roleIds: readonly string[],
  ): Promise<ReadonlySet<WorkspacePermissionKey>> {
    const grants = await this.grantsCache.getMany(roleIds);

    const missing = roleIds.filter((id) => !grants.has(id));

    if (missing.length > 0) {
      const loaded = await this.roleRepo.findGrants(missing);

      const filled = new Map(missing.map((id) => [id, loaded.get(id) ?? []]));

      await this.grantsCache.setMany(filled);

      for (const [id, keys] of filled) {
        grants.set(id, keys);
      }
    }

    return WORKSPACE_PERMISSION_CATALOGUE.narrow([...grants.values()].flat());
  }
}
