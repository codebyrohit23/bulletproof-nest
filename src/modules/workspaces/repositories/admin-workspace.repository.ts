import { Injectable } from '@nestjs/common';
import { type Prisma, WorkspaceStatus } from '@prisma/client';

import { PrismaService, toOffsetArgs } from '#/infrastructure/database/prisma/index.js';
import type { OffsetSlice } from '#/shared/pagination/index.js';

import {
  ADMIN_WORKSPACE_DETAIL_SELECT,
  ADMIN_WORKSPACE_SUMMARY_SELECT,
} from '../constants/index.js';
import type { AdminListWorkspacesQuery } from '../dto/index.js';
import type {
  AdminWorkspaceDetailRow,
  AdminWorkspaceSummaryRow,
  ReviewDecision,
} from '../interfaces/index.js';

/**
 * The platform's view: queries here span every workspace. Kept apart from the
 * tenant-facing repositories so that "not scoped to a workspace" is a property
 * of one file, reachable only from admin routes, rather than of some methods
 * in a repository that is otherwise always scoped.
 */
@Injectable()
export class AdminWorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Search is a substring match — a scan, acceptable at platform-admin scale. */
  async findPage(query: AdminListWorkspacesQuery): Promise<OffsetSlice<AdminWorkspaceSummaryRow>> {
    const where = {
      ...(query.status !== undefined ? { status: query.status } : {}),
      ...(query.search !== undefined
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search.toLowerCase() } },
            ],
          }
        : {}),
    } satisfies Prisma.WorkspaceWhereInput;

    const [total, rows] = await Promise.all([
      this.prisma.db.workspace.count({ where }),
      this.prisma.db.workspace.findMany({
        where,
        select: ADMIN_WORKSPACE_SUMMARY_SELECT,
        ...toOffsetArgs(query, [{ createdAt: query.order }]),
      }),
    ]);

    return { rows, total };
  }

  async findDetail(id: string): Promise<AdminWorkspaceDetailRow | null> {
    return this.prisma.db.workspace.findUnique({
      where: { id },
      select: ADMIN_WORKSPACE_DETAIL_SELECT,
    });
  }

  async findStatus(id: string): Promise<WorkspaceStatus | null> {
    const workspace = await this.prisma.db.workspace.findUnique({
      where: { id },
      select: { status: true },
    });

    return workspace?.status ?? null;
  }

  /**
   * Ends a pending review. Conditional on the workspace still being pending,
   * so of two admins deciding at once exactly one succeeds; `false` means this
   * caller was not that one, or there was nothing to review.
   */
  async recordReview(id: string, decision: ReviewDecision, now: Date): Promise<boolean> {
    const { count } = await this.prisma.db.workspace.updateMany({
      where: { id, status: WorkspaceStatus.PENDING_APPROVAL },
      data: {
        status: decision.outcome,
        reviewedAt: now,
        reviewedByAdminId: decision.adminId,
        reviewNote: decision.note,
      },
    });

    return count > 0;
  }
}
