import { Injectable } from '@nestjs/common';
import { AdminStatus } from '@prisma/client';

import {
  ADMIN_PERMISSION_CATALOGUE,
  AdminPermissionResolver,
  type AdminGrant,
} from '#/core/permissions/index.js';
import { AdminRoleGrantsService } from '#/modules/admin-roles/index.js';

import { AdminGrantSubjectCacheService } from '../cache/admin-grant-subject.cache.js';
import { AdminRepository } from '../repositories/index.js';

/** Built once: a super admin's grant is the whole catalogue, fixed per build. */
const EVERY_PERMISSION = new Set(ADMIN_PERMISSION_CATALOGUE.keys);

/**
 * What an admin may do — the answer `PermissionGuard` and `GET /admin/me/access`
 * both use.
 *
 * `null` for an admin who is deleted or not ACTIVE. Authentication does not
 * check status on each request — a session outlives a suspension — so this is
 * where a suspended admin loses every permission. Routes marked `@AnyAdmin()`
 * do not reach here; suspending an admin must also revoke their sessions.
 */
@Injectable()
export class AdminGrantService extends AdminPermissionResolver {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly subjectCache: AdminGrantSubjectCacheService,
    private readonly roleGrants: AdminRoleGrantsService,
  ) {
    super();
  }

  override async resolve(adminId: string): Promise<AdminGrant | null> {
    const subject = await this.subjectCache.remember(adminId, () =>
      this.adminRepo.findGrantSubject(adminId),
    );

    if (subject === null || subject.status !== AdminStatus.ACTIVE) {
      return null;
    }

    if (subject.isSuperAdmin) {
      return { isSuperAdmin: true, roleIds: subject.roleIds, permissions: EVERY_PERMISSION };
    }

    return {
      isSuperAdmin: false,
      roleIds: subject.roleIds,
      permissions: await this.roleGrants.permissionsOf(subject.roleIds),
    };
  }
}
