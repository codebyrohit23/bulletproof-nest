import { Injectable } from '@nestjs/common';

import { ADMIN_PERMISSION_CATALOGUE, type AdminPermissionKey } from '#/core/permissions/index.js';

import { AdminRoleGrantsCacheService } from '../cache/admin-role-grants.cache.js';
import { AdminRoleRepository } from '../repositories/index.js';

/**
 * The permissions a set of admin roles grants — their union. Every admin role
 * is custom, so every grant comes from the cache by role id, and on a miss
 * from one query for every missing role.
 *
 * Restricted keys are removed: they belong to super admins alone, and a row
 * granting one to a role is a bug this must not turn into access.
 */
@Injectable()
export class AdminRoleGrantsService {
  constructor(
    private readonly roleRepo: AdminRoleRepository,
    private readonly grantsCache: AdminRoleGrantsCacheService,
  ) {}

  async permissionsOf(roleIds: readonly string[]): Promise<ReadonlySet<AdminPermissionKey>> {
    if (roleIds.length === 0) {
      return new Set();
    }

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

    const granted = new Set<AdminPermissionKey>();

    for (const key of ADMIN_PERMISSION_CATALOGUE.narrow([...grants.values()].flat())) {
      if (!ADMIN_PERMISSION_CATALOGUE.restrictedKeys.has(key)) {
        granted.add(key);
      }
    }

    return granted;
  }
}
