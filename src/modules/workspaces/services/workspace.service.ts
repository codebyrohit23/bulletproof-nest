import { ConflictException, Injectable } from '@nestjs/common';
import { WorkspaceStatus } from '@prisma/client';

import { AppLoggerService } from '#/core/logger/index.js';
import {
  isUniqueConstraintViolation,
  TransactionService,
} from '#/infrastructure/database/prisma/index.js';
import { buildOffsetPagination, paginate } from '#/shared/pagination/index.js';

import {
  MAX_OWNED_WORKSPACES,
  OWNED_WORKSPACE_CAP_STATUSES,
  WORKSPACE_CREATE_ATTEMPTS,
  WORKSPACE_ERROR_MESSAGE,
  WORKSPACE_REQUIRES_APPROVAL,
  WORKSPACES_LOG_CONTEXT,
} from '../constants/index.js';
import type {
  CreateWorkspaceInput,
  ListMyWorkspacesQuery,
  MyWorkspacePage,
  Workspace,
} from '../dto/index.js';
import { toCreateWorkspaceRow, toMyWorkspace, toWorkspace } from '../mappers/index.js';
import { WorkspaceMemberRepository, WorkspaceRepository } from '../repositories/index.js';
import { workspaceSlugCandidates } from '../utils/index.js';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly memberRepo: WorkspaceMemberRepository,
    private readonly transaction: TransactionService,
  ) {}

  async createWorkspace(ownerUserId: string, input: CreateWorkspaceInput): Promise<Workspace> {
    await this.assertCanCreate(ownerUserId, input.slug);

    const status = WORKSPACE_REQUIRES_APPROVAL
      ? WorkspaceStatus.PENDING_APPROVAL
      : WorkspaceStatus.ACTIVE;

    for (let attempt = 1; attempt <= WORKSPACE_CREATE_ATTEMPTS; attempt++) {
      const slug = input.slug ?? (await this.pickSlug(input.name));

      try {
        const workspace = await this.transaction.run(async () => {
          const created = await this.workspaceRepo.create(
            toCreateWorkspaceRow(input, ownerUserId, slug, status),
          );

          await this.memberRepo.createOwner(created.id, ownerUserId);

          return created;
        });

        return toWorkspace(workspace, ownerUserId);
      } catch (error) {
        if (!isUniqueConstraintViolation(error)) {
          throw error;
        }

        await this.explainCreateConflict(ownerUserId, input.slug);

        this.logger.warn('A derived workspace slug was claimed concurrently', {
          context: WORKSPACES_LOG_CONTEXT,
          operation: 'createWorkspace',
          metadata: { ownerUserId, attempt },
        });
      }
    }

    throw new ConflictException(WORKSPACE_ERROR_MESSAGE.CREATE_CONFLICT);
  }

  async listMyWorkspaces(userId: string, query: ListMyWorkspacesQuery): Promise<MyWorkspacePage> {
    const { rows, total } = await this.memberRepo.findPageForUser(userId, query);

    return paginate(
      rows.map((row) => toMyWorkspace(row, userId)),
      buildOffsetPagination(total, query.page, query.limit),
    );
  }

  private async assertCanCreate(ownerUserId: string, explicitSlug?: string): Promise<void> {
    const [hasPendingReview, owned] = await Promise.all([
      WORKSPACE_REQUIRES_APPROVAL
        ? this.workspaceRepo.hasPendingReview(ownerUserId)
        : Promise.resolve(false),
      this.workspaceRepo.countOwned(ownerUserId, OWNED_WORKSPACE_CAP_STATUSES),
    ]);

    if (hasPendingReview) {
      throw new ConflictException(WORKSPACE_ERROR_MESSAGE.PENDING_REVIEW_EXISTS);
    }

    if (owned >= MAX_OWNED_WORKSPACES) {
      throw new ConflictException(WORKSPACE_ERROR_MESSAGE.OWNED_LIMIT_REACHED);
    }

    if (explicitSlug !== undefined && (await this.isSlugTaken(explicitSlug))) {
      throw new ConflictException(WORKSPACE_ERROR_MESSAGE.SLUG_TAKEN);
    }
  }

  private async explainCreateConflict(ownerUserId: string, explicitSlug?: string): Promise<void> {
    if (WORKSPACE_REQUIRES_APPROVAL && (await this.workspaceRepo.hasPendingReview(ownerUserId))) {
      throw new ConflictException(WORKSPACE_ERROR_MESSAGE.PENDING_REVIEW_EXISTS);
    }

    if (explicitSlug !== undefined) {
      throw new ConflictException(WORKSPACE_ERROR_MESSAGE.SLUG_TAKEN);
    }
  }

  private async pickSlug(name: string): Promise<string> {
    const candidates = workspaceSlugCandidates(name);

    const taken = await this.workspaceRepo.findTakenSlugs(candidates);

    const free = candidates.find((candidate) => !taken.has(candidate));

    if (free === undefined) {
      this.logger.warn('Every derived workspace slug candidate was taken', {
        context: WORKSPACES_LOG_CONTEXT,
        operation: 'pickSlug',
        metadata: { candidates: candidates.length },
      });

      throw new ConflictException(WORKSPACE_ERROR_MESSAGE.CREATE_CONFLICT);
    }

    return free;
  }

  private async isSlugTaken(slug: string): Promise<boolean> {
    const taken = await this.workspaceRepo.findTakenSlugs([slug]);

    return taken.has(slug);
  }
}
