import { Injectable } from '@nestjs/common';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

@Injectable()
export class AdminRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSummaries(roleIds: readonly string[]): Promise<{ id: string; name: string }[]> {
    if (roleIds.length === 0) {
      return [];
    }

    return this.prisma.db.adminRole.findMany({
      where: { id: { in: [...roleIds] } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  /** Every grant of these roles in one query. A role with no grants is absent from the map. */
  async findGrants(roleIds: readonly string[]): Promise<Map<string, string[]>> {
    const rows = await this.prisma.db.adminRolePermission.findMany({
      where: { roleId: { in: [...roleIds] } },
      select: { roleId: true, permissionKey: true },
    });

    const grants = new Map<string, string[]>();

    for (const row of rows) {
      const keys = grants.get(row.roleId);

      if (keys === undefined) {
        grants.set(row.roleId, [row.permissionKey]);
      } else {
        keys.push(row.permissionKey);
      }
    }

    return grants;
  }
}
