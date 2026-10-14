import { Injectable } from '@nestjs/common';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

/**
 * `admin_user_roles` — which roles each admin holds. Owned here, not by
 * `modules/admins`, because deleting a role must remove it from its holders
 * and this module cannot import the one that imports it.
 */
@Injectable()
export class AdminUserRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findRoleIds(adminId: string): Promise<string[]> {
    const rows = await this.prisma.db.adminUserRole.findMany({
      where: { adminId },
      select: { roleId: true },
    });

    return rows.map((row) => row.roleId);
  }

  /** How many admins who are not deleted hold each role. */
  async countHolders(roleIds: readonly string[]): Promise<Map<string, number>> {
    if (roleIds.length === 0) {
      return new Map();
    }

    const groups = await this.prisma.db.adminUserRole.groupBy({
      by: ['roleId'],
      where: { roleId: { in: [...roleIds] }, admin: { deletedAt: null } },
      _count: { _all: true },
    });

    return new Map(groups.map((group) => [group.roleId, group._count._all]));
  }

  /** Every admin who holds the role, deleted or not — their cached roles must all be dropped. */
  async findHolderIds(roleId: string): Promise<string[]> {
    const rows = await this.prisma.db.adminUserRole.findMany({
      where: { roleId },
      select: { adminId: true },
    });

    return rows.map((row) => row.adminId);
  }

  async removeRoleFromAll(roleId: string): Promise<void> {
    await this.prisma.db.adminUserRole.deleteMany({ where: { roleId } });
  }
}
