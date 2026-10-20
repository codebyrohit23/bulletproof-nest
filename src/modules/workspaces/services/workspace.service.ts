import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FilePurpose, WorkspaceStatus } from '@prisma/client';

import { AppLoggerService } from '#/core/logger/index.js';
import {
  isUniqueConstraintViolation,
  TransactionService,
} from '#/infrastructure/database/prisma/index.js';
import { FilesService, workspaceUploader } from '#/modules/files/index.js';
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
  CurrentWorkspace,
  ListMyWorkspacesQuery,
  MyWorkspacePage,
  UpdateWorkspaceInput,
  Workspace,
} from '../dto/index.js';
import type { WorkspaceSnapshot } from '../interfaces/index.js';
import {
  toCreateWorkspaceRow,
  toCurrentWorkspace,
  toMyWorkspace,
  toWorkspace,
} from '../mappers/index.js';
import { WorkspaceMemberRepository, WorkspaceRepository } from '../repositories/index.js';
import { workspaceSlugCandidates } from '../utils/index.js';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly memberRepo: WorkspaceMemberRepository,
    private readonly transaction: TransactionService,
    private readonly files: FilesService,
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

        return toWorkspace(workspace, ownerUserId, null);
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

  /**
   * The tenant guard has already proved the membership, so a miss here means
   * it ended in between — answered as the guard answers a non-member.
   */
  async getCurrentWorkspace(
    workspaceId: string,
    memberId: string,
    userId: string,
  ): Promise<CurrentWorkspace> {
    const membership = await this.memberRepo.findCurrent(workspaceId, memberId);

    if (membership === null) {
      throw new NotFoundException(WORKSPACE_ERROR_MESSAGE.WORKSPACE_NOT_FOUND);
    }

    const logo = await this.files.attachedImage(membership.workspace.logoFileId);

    return toCurrentWorkspace(membership, userId, logo);
  }

  /** Every logo on the page in one query, not one per workspace. */
  async listMyWorkspaces(userId: string, query: ListMyWorkspacesQuery): Promise<MyWorkspacePage> {
    const { rows, total } = await this.memberRepo.findPageForUser(userId, query);
    const logos = await this.files.attachedImages(rows.map((row) => row.workspace.logoFileId));

    return paginate(
      rows.map((row) => {
        const logoFileId = row.workspace.logoFileId;

        return toMyWorkspace(row, userId, logoFileId ? (logos.get(logoFileId) ?? null) : null);
      }),
      buildOffsetPagination(total, query.page, query.limit),
    );
  }

  /**
   * A `logoFileId` attaches that file — the caller's own upload in this
   * workspace — and releases the logo it replaces. This never removes the
   * logo; `removeLogo` does.
   */
  async updateWorkspace(
    workspaceId: string,
    memberId: string,
    userId: string,
    input: UpdateWorkspaceInput,
  ): Promise<CurrentWorkspace> {
    await this.transaction.run(async () => {
      const workspace = await this.findOrThrow(workspaceId);
      const next = input.logoFileId;

      if (next && next !== workspace.logoFileId) {
        await this.files.attach(next, {
          purpose: FilePurpose.WORKSPACE_LOGO,
          uploader: workspaceUploader(userId, workspaceId),
        });

        await this.moveLogo(workspaceId, workspace.logoFileId, next);
      }
    });

    return this.getCurrentWorkspace(workspaceId, memberId, userId);
  }

  /** Succeeds when there is no logo too — the result is what was asked for. */
  async removeLogo(
    workspaceId: string,
    memberId: string,
    userId: string,
  ): Promise<CurrentWorkspace> {
    await this.transaction.run(async () => {
      const workspace = await this.findOrThrow(workspaceId);

      if (workspace.logoFileId) {
        await this.moveLogo(workspaceId, workspace.logoFileId, null);
      }
    });

    return this.getCurrentWorkspace(workspaceId, memberId, userId);
  }

  private async findOrThrow(workspaceId: string): Promise<WorkspaceSnapshot> {
    const workspace = await this.workspaceRepo.findById(workspaceId);

    if (workspace === null) {
      throw new NotFoundException(WORKSPACE_ERROR_MESSAGE.WORKSPACE_NOT_FOUND);
    }

    return workspace;
  }

  private async moveLogo(
    workspaceId: string,
    from: string | null,
    to: string | null,
  ): Promise<void> {
    if (!(await this.workspaceRepo.replaceLogo(workspaceId, from, to))) {
      throw new ConflictException(WORKSPACE_ERROR_MESSAGE.LOGO_CHANGED);
    }

    if (from !== null) {
      await this.files.release(from);
    }
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
