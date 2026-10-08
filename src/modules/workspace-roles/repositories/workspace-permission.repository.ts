import { Injectable } from '@nestjs/common';

import type { PermissionMirrorRow } from '#/core/permissions/index.js';
import { PrismaService } from '#/infrastructure/database/prisma/index.js';

const PERMISSION_MIRROR_SELECT = {
  key: true,
  resource: true,
  action: true,
  name: true,
  description: true,
  restricted: true,
} as const;

/** `workspace_permissions` — the catalogue's mirror. Written by the seeder only. */
@Injectable()
export class WorkspacePermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<PermissionMirrorRow[]> {
    return this.prisma.db.workspacePermission.findMany({ select: PERMISSION_MIRROR_SELECT });
  }

  async createMany(rows: readonly PermissionMirrorRow[]): Promise<void> {
    if (rows.length === 0) {
      return;
    }

    await this.prisma.db.workspacePermission.createMany({ data: [...rows] });
  }

  async update(row: PermissionMirrorRow): Promise<void> {
    const { key, ...data } = row;

    await this.prisma.db.workspacePermission.update({
      where: { key },
      data,
      select: { key: true },
    });
  }
}
