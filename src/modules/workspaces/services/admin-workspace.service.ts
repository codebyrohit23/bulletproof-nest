import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { WorkspaceStatus } from '@prisma/client';

import { AppLoggerService } from '#/core/logger/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';
import { buildOffsetPagination, paginate } from '#/shared/pagination/index.js';

import { WORKSPACE_ERROR_MESSAGE, WORKSPACES_LOG_CONTEXT } from '../constants/index.js';
import type {
  AdminApproveWorkspaceInput,
  AdminListWorkspacesQuery,
  AdminRejectWorkspaceInput,
  AdminWorkspaceDetail,
  AdminWorkspacePage,
} from '../dto/index.js';
import type { ReviewDecision } from '../interfaces/index.js';
import { toAdminWorkspaceDetail, toAdminWorkspaceSummary } from '../mappers/index.js';
import { AdminWorkspaceRepository } from '../repositories/index.js';

@Injectable()
export class AdminWorkspaceService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly adminWorkspaceRepo: AdminWorkspaceRepository,
    private readonly transaction: TransactionService,
  ) {}

  async listWorkspaces(query: AdminListWorkspacesQuery): Promise<AdminWorkspacePage> {
    const { rows, total } = await this.adminWorkspaceRepo.findPage(query);

    return paginate(
      rows.map(toAdminWorkspaceSummary),
      buildOffsetPagination(total, query.page, query.limit),
    );
  }

  async getWorkspace(workspaceId: string): Promise<AdminWorkspaceDetail> {
    const workspace = await this.adminWorkspaceRepo.findDetail(workspaceId);

    if (workspace === null) {
      throw new NotFoundException(WORKSPACE_ERROR_MESSAGE.WORKSPACE_NOT_FOUND);
    }

    return toAdminWorkspaceDetail(workspace);
  }

  async approveWorkspace(
    adminId: string,
    workspaceId: string,
    input: AdminApproveWorkspaceInput,
  ): Promise<AdminWorkspaceDetail> {
    return this.review(workspaceId, {
      outcome: WorkspaceStatus.ACTIVE,
      adminId,
      note: input.note ?? null,
    });
  }

  async rejectWorkspace(
    adminId: string,
    workspaceId: string,
    input: AdminRejectWorkspaceInput,
  ): Promise<AdminWorkspaceDetail> {
    return this.review(workspaceId, {
      outcome: WorkspaceStatus.REJECTED,
      adminId,
      note: input.note,
    });
  }

  /**
   * In a transaction although it is one statement: the owner's notification
   * email joins it, so the decision and the email commit together.
   */
  private async review(
    workspaceId: string,
    decision: ReviewDecision,
  ): Promise<AdminWorkspaceDetail> {
    const reviewed = await this.transaction.run(() =>
      this.adminWorkspaceRepo.recordReview(workspaceId, decision, new Date()),
    );

    if (!reviewed) {
      await this.refuseReview(workspaceId);
    }

    this.logger.info('Workspace reviewed', {
      context: WORKSPACES_LOG_CONTEXT,
      operation: 'review',
      metadata: { workspaceId, adminId: decision.adminId, outcome: decision.outcome },
    });

    return this.getWorkspace(workspaceId);
  }

  /** 404 when there is no such workspace; 409 when it exists but is not pending. */
  private async refuseReview(workspaceId: string): Promise<never> {
    const status = await this.adminWorkspaceRepo.findStatus(workspaceId);

    if (status === null) {
      throw new NotFoundException(WORKSPACE_ERROR_MESSAGE.WORKSPACE_NOT_FOUND);
    }

    throw new ConflictException(WORKSPACE_ERROR_MESSAGE.NOT_AWAITING_REVIEW);
  }
}
