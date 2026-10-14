import { Injectable } from '@nestjs/common';
import { MembershipStatus, type Prisma } from '@prisma/client';

import { PrismaService, toOffsetArgs } from '#/infrastructure/database/prisma/index.js';
import type { OffsetPaginationQuery, OffsetSlice } from '#/shared/pagination/index.js';

import {
  CURRENT_MEMBERSHIP_SELECT,
  MY_WORKSPACE_SELECT,
  SWITCHER_WORKSPACE_STATUSES,
} from '../constants/index.js';
import type {
  CurrentMembershipRow,
  MembershipAccessSnapshot,
  MyWorkspaceRow,
} from '../interfaces/index.js';
import { toMembershipAccessSnapshot } from '../mappers/index.js';

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
  async findAccessSnapshot(
    workspaceId: string,
    userId: string,
  ): Promise<MembershipAccessSnapshot | null> {
    const member = await this.prisma.db.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
      select: { id: true, status: true },
    });

    return member === null ? null : toMembershipAccessSnapshot(member);
  }

  /** Scoped by workspace as well as id, as every tenant read is. */
  async findCurrent(workspaceId: string, memberId: string): Promise<CurrentMembershipRow | null> {
    return this.prisma.db.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
      select: CURRENT_MEMBERSHIP_SELECT,
    });
  }

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
