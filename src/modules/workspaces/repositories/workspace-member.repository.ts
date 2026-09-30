import { Injectable } from '@nestjs/common';
import { MembershipStatus, type Prisma } from '@prisma/client';

import { PrismaService, toOffsetArgs } from '#/infrastructure/database/prisma/index.js';
import type { OffsetPaginationQuery, OffsetSlice } from '#/shared/pagination/index.js';

import { MY_WORKSPACE_SELECT, SWITCHER_WORKSPACE_STATUSES } from '../constants/index.js';
import type { MyWorkspaceRow } from '../interfaces/index.js';

@Injectable()
export class WorkspaceMemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** The creator's membership. Active from the start, invited by nobody. */
  async createOwner(workspaceId: string, userId: string): Promise<void> {
    await this.prisma.db.workspaceMember.create({
      data: { workspaceId, userId, status: MembershipStatus.ACTIVE },
      select: { id: true },
    });
  }

  /**
   * The caller's active memberships in workspaces the switcher shows. Most
   * recently opened first; never-opened ones — a workspace just created or
   * joined — after those, newest first.
   */
  async findPageForUser(
    userId: string,
    query: OffsetPaginationQuery,
  ): Promise<OffsetSlice<MyWorkspaceRow>> {
    const where = {
      userId,
      status: MembershipStatus.ACTIVE,
      workspace: { status: { in: [...SWITCHER_WORKSPACE_STATUSES] } },
    } satisfies Prisma.WorkspaceMemberWhereInput;

    const [total, rows] = await Promise.all([
      this.prisma.db.workspaceMember.count({ where }),
      this.prisma.db.workspaceMember.findMany({
        where,
        select: MY_WORKSPACE_SELECT,
        ...toOffsetArgs(query, [
          { lastAccessedAt: { sort: 'desc', nulls: 'last' } },
          { joinedAt: 'desc' },
        ]),
      }),
    ]);

    return { rows, total };
  }
}
