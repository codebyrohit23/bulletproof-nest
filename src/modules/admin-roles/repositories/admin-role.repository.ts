import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

const ADMIN_ROLE_SELECT = {
  id: true,
  name: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.AdminRoleSelect;

export type AdminRoleRow = Prisma.AdminRoleGetPayload<{ select: typeof ADMIN_ROLE_SELECT }>;

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

  async findAll(): Promise<AdminRoleRow[]> {
    return this.prisma.db.adminRole.findMany({
      select: ADMIN_ROLE_SELECT,
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<AdminRoleRow | null> {
    return this.prisma.db.adminRole.findUnique({ where: { id }, select: ADMIN_ROLE_SELECT });
  }

  async count(): Promise<number> {
    return this.prisma.db.adminRole.count();
  }

  /** Case-insensitive, as the unique index is. `exceptId` skips the role being renamed. */
  async isNameTaken(name: string, exceptId?: string): Promise<boolean> {
    const found = await this.prisma.db.adminRole.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId !== undefined ? { id: { not: exceptId } } : {}),
      },
      select: { id: true },
    });

    return found !== null;
  }

  async create(data: { name: string; description: string | null }): Promise<AdminRoleRow> {
    return this.prisma.db.adminRole.create({ data, select: ADMIN_ROLE_SELECT });
  }

  async update(id: string, data: { name?: string; description?: string | null }): Promise<void> {
    await this.prisma.db.adminRole.update({ where: { id }, data, select: { id: true } });
  }

  /** The role's grants become exactly `keys`. */
  async replaceGrants(roleId: string, keys: readonly string[]): Promise<void> {
    await this.prisma.db.adminRolePermission.deleteMany({ where: { roleId } });

    if (keys.length > 0) {
      await this.prisma.db.adminRolePermission.createMany({
        data: keys.map((permissionKey) => ({ roleId, permissionKey })),
      });
    }
  }

  /** Grants go with it, by cascade. Assignments must be removed first — they restrict. */
  async delete(id: string): Promise<void> {
    await this.prisma.db.adminRole.delete({ where: { id }, select: { id: true } });
  }
}
