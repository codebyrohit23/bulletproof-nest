import { Injectable } from '@nestjs/common';
import { WorkspaceStatus } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

import { WORKSPACE_SELECT } from '../constants/index.js';
import type {
  CreateWorkspaceRow,
  WorkspaceAccessSnapshot,
  WorkspaceSnapshot,
} from '../interfaces/index.js';

@Injectable()
export class WorkspaceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(row: CreateWorkspaceRow): Promise<WorkspaceSnapshot> {
    return this.prisma.db.workspace.create({ data: row, select: WORKSPACE_SELECT });
  }

  async findById(id: string): Promise<WorkspaceSnapshot | null> {
    return this.prisma.db.workspace.findUnique({ where: { id }, select: WORKSPACE_SELECT });
  }

  /**
   * Moves the logo from `from` to `to` only if it is still `from`. Of two
   * changes at once, the second matches nothing and gets `false`, so it cannot
   * overwrite the first and leave the first's file attached to nobody.
   */
  async replaceLogo(id: string, from: string | null, to: string | null): Promise<boolean> {
    const { count } = await this.prisma.db.workspace.updateMany({
      where: { id, logoFileId: from },
      data: { logoFileId: to },
    });

    return count === 1;
  }

  async findAccessSnapshot(id: string): Promise<WorkspaceAccessSnapshot | null> {
    return this.prisma.db.workspace.findUnique({
      where: { id },
      select: { status: true, ownerUserId: true },
    });
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
