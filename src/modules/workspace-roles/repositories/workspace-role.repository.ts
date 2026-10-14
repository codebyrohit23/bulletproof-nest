import { Injectable } from '@nestjs/common';
import { InvitationStatus, type Prisma } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

import type { WorkspaceDefaultRoleDefinition } from '../constants/index.js';
import type { WorkspaceRoleSummary } from '../interfaces/index.js';

export interface DefaultRoleRow {
  readonly id: string;

  readonly name: string;

  readonly description: string | null;
}

@Injectable()
export class WorkspaceRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** `key` is unique and set only on default roles, so this finds exactly one or none. */
  async findDefaultRole(key: string): Promise<DefaultRoleRow | null> {
    return this.prisma.db.workspaceRole.findUnique({
      where: { key },
      select: { id: true, name: true, description: true },
    });
  }

  async createDefaultRole(key: string, role: WorkspaceDefaultRoleDefinition): Promise<string> {
    const created = await this.prisma.db.workspaceRole.create({
      data: { key, name: role.name, description: role.description, isSystem: true },
      select: { id: true },
    });

    return created.id;
  }

  async updateDefaultRole(id: string, role: WorkspaceDefaultRoleDefinition): Promise<void> {
    await this.prisma.db.workspaceRole.update({
      where: { id },
      data: { name: role.name, description: role.description },
      select: { id: true },
    });
  }

  async findGrantKeys(roleId: string): Promise<string[]> {
    const rows = await this.prisma.db.workspaceRolePermission.findMany({
      where: { roleId },
      select: { permissionKey: true },
    });

    return rows.map((row) => row.permissionKey);
  }

  async addGrants(roleId: string, keys: readonly string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    await this.prisma.db.workspaceRolePermission.createMany({
      data: keys.map((permissionKey) => ({ roleId, permissionKey })),
      skipDuplicates: true,
    });
  }

  async findSummaries(roleIds: readonly string[]): Promise<WorkspaceRoleSummary[]> {
    if (roleIds.length === 0) {
      return [];
    }

    return this.prisma.db.workspaceRole.findMany({
      where: { id: { in: [...roleIds] } },
      select: { id: true, key: true, name: true, isSystem: true },
    });
  }

  /** Every grant of these roles in one query. A role with no grants is absent from the map. */
  async findGrants(roleIds: readonly string[]): Promise<Map<string, string[]>> {
    const rows = await this.prisma.db.workspaceRolePermission.findMany({
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

  async removeGrants(roleId: string, keys: readonly string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    await this.prisma.db.workspaceRolePermission.deleteMany({
      where: { roleId, permissionKey: { in: [...keys] } },
    });
  }

  /* ----------------------------------------------------------------------
   * Custom roles — every read scoped to one workspace's view: the default
   * roles plus that workspace's own. Another workspace's role is never found.
   * -------------------------------------------------------------------- */

  async findVisible(workspaceId: string): Promise<WorkspaceRoleRow[]> {
    return this.prisma.db.workspaceRole.findMany({
      where: visibleTo(workspaceId),
      select: WORKSPACE_ROLE_SELECT,
    });
  }

  async findVisibleById(workspaceId: string, id: string): Promise<WorkspaceRoleRow | null> {
    return this.prisma.db.workspaceRole.findFirst({
      where: { id, ...visibleTo(workspaceId) },
      select: WORKSPACE_ROLE_SELECT,
    });
  }

  async countCustom(workspaceId: string): Promise<number> {
    return this.prisma.db.workspaceRole.count({ where: { workspaceId } });
  }

  /** Case-insensitive, as the unique index is. `exceptId` skips the role being renamed. */
  async isNameTaken(workspaceId: string, name: string, exceptId?: string): Promise<boolean> {
    const found = await this.prisma.db.workspaceRole.findFirst({
      where: {
        workspaceId,
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId !== undefined ? { id: { not: exceptId } } : {}),
      },
      select: { id: true },
    });

    return found !== null;
  }

  async createCustom(
    workspaceId: string,
    data: { name: string; description: string | null },
  ): Promise<WorkspaceRoleRow> {
    return this.prisma.db.workspaceRole.create({
      data: { workspaceId, name: data.name, description: data.description },
      select: WORKSPACE_ROLE_SELECT,
    });
  }

  async updateCustom(
    id: string,
    data: { name?: string; description?: string | null },
  ): Promise<void> {
    await this.prisma.db.workspaceRole.update({ where: { id }, data, select: { id: true } });
  }

  /** The role's grants become exactly `keys`. */
  async replaceGrants(roleId: string, keys: readonly string[]): Promise<void> {
    await this.prisma.db.workspaceRolePermission.deleteMany({ where: { roleId } });

    await this.addGrants(roleId, keys);
  }

  /** Grants go with it, by cascade. Assignments must be removed first — they restrict. */
  async deleteCustom(id: string): Promise<void> {
    await this.prisma.db.workspaceRole.delete({ where: { id }, select: { id: true } });
  }

  async countPendingInvitations(workspaceId: string, roleId: string): Promise<number> {
    return this.prisma.db.workspaceInvitation.count({
      where: { workspaceId, roleId, status: InvitationStatus.PENDING },
    });
  }
}

const WORKSPACE_ROLE_SELECT = {
  id: true,
  key: true,
  name: true,
  description: true,
  isSystem: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.WorkspaceRoleSelect;

export type WorkspaceRoleRow = Prisma.WorkspaceRoleGetPayload<{
  select: typeof WORKSPACE_ROLE_SELECT;
}>;

function visibleTo(workspaceId: string): Prisma.WorkspaceRoleWhereInput {
  return { OR: [{ workspaceId: null }, { workspaceId }] };
}
