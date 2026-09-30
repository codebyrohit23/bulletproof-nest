import { Injectable } from '@nestjs/common';
import { WorkspaceStatus } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

import { WORKSPACE_SELECT } from '../constants/index.js';
import type { CreateWorkspaceRow, WorkspaceSnapshot } from '../interfaces/index.js';

@Injectable()
export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(row: CreateWorkspaceRow): Promise<WorkspaceSnapshot> {
    return this.prisma.db.workspace.create({ data: row, select: WORKSPACE_SELECT });
  }

  async countOwned(ownerUserId: string, statuses: readonly WorkspaceStatus[]): Promise<number> {
    return this.prisma.db.workspace.count({
      where: { ownerUserId, status: { in: [...statuses] } },
    });
  }

  async hasPendingReview(ownerUserId: string): Promise<boolean> {
    const pending = await this.prisma.db.workspace.findFirst({
      where: { ownerUserId, status: WorkspaceStatus.PENDING_APPROVAL },
      select: { id: true },
    });

    return pending !== null;
  }

  /** Which of these slugs are in use — one query for every candidate. */
  async findTakenSlugs(slugs: readonly string[]): Promise<ReadonlySet<string>> {
    const rows = await this.prisma.db.workspace.findMany({
      where: { slug: { in: [...slugs] } },
      select: { slug: true },
    });

    return new Set(rows.map((row) => row.slug));
  }
}
