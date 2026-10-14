import { Injectable } from '@nestjs/common';
import { MembershipStatus } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

import type { WorkspaceRoleRef } from '../interfaces/index.js';

/** Members who count as holding a role in a role list: those who can still return. */
const COUNTED_MEMBER_STATUSES = [MembershipStatus.ACTIVE, MembershipStatus.SUSPENDED];

/**
 * `workspace_member_roles` — which roles each member holds. Owned here, not by
 * `modules/workspaces`, because deleting a role must remove it from its holders
 * and this module cannot import the one that imports it.
 */
@Injectable()
export class WorkspaceMemberRoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The roles a member holds, each with its `key` — set on default roles only. */
  async findRoles(workspaceId: string, memberId: string): Promise<WorkspaceRoleRef[]> {
    const rows = await this.prisma.db.workspaceMemberRole.findMany({
      where: { workspaceId, memberId },
      select: { role: { select: { id: true, key: true } } },
    });

    return rows.map((row) => row.role);
  }

  /** How many active or suspended members of the workspace hold each role. */
  async countHolders(
    workspaceId: string,
    roleIds: readonly string[],
  ): Promise<Map<string, number>> {
    if (roleIds.length === 0) {
      return new Map();
    }

    const groups = await this.prisma.db.workspaceMemberRole.groupBy({
      by: ['roleId'],
      where: {
        workspaceId,
        roleId: { in: [...roleIds] },
        member: { status: { in: COUNTED_MEMBER_STATUSES } },
      },
      _count: { _all: true },
    });

    return new Map(groups.map((group) => [group.roleId, group._count._all]));
  }

  /** Every member of the workspace who holds the role, any status. */
  async findHolderIds(workspaceId: string, roleId: string): Promise<string[]> {
    const rows = await this.prisma.db.workspaceMemberRole.findMany({
      where: { workspaceId, roleId },
      select: { memberId: true },
    });

    return rows.map((row) => row.memberId);
  }

  async removeRoleFromAll(workspaceId: string, roleId: string): Promise<void> {
    await this.prisma.db.workspaceMemberRole.deleteMany({ where: { workspaceId, roleId } });
  }
}
