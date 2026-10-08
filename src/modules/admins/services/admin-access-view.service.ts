import { ForbiddenException, Injectable } from '@nestjs/common';

import { AdminPermissionResolver } from '#/core/permissions/index.js';
import { AdminRoleService } from '#/modules/admin-roles/index.js';

import { ADMIN_ERROR_MESSAGE } from '../constants/index.js';
import type { AdminAccess } from '../dto/index.js';

/**
 * `GET /admin/me/access`: the admin's grant, in the shape the console renders
 * from — from the same resolver the guard uses.
 */
@Injectable()
export class AdminAccessViewService {
  constructor(
    private readonly resolver: AdminPermissionResolver,
    private readonly roleService: AdminRoleService,
  ) {}

  async getAccess(adminId: string): Promise<AdminAccess> {
    const grant = await this.resolver.resolve(adminId);

    /* Deleted or not ACTIVE — the session still authenticates, but the admin holds nothing. */
    if (grant === null) {
      throw new ForbiddenException(ADMIN_ERROR_MESSAGE.ACCOUNT_NOT_ACTIVE);
    }

    const roles = await this.roleService.findSummaries(grant.roleIds);

    return {
      adminId,
      isSuperAdmin: grant.isSuperAdmin,
      roles,
      permissions: [...grant.permissions].sort(),
    };
  }
}
