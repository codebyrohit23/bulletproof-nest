import { Injectable } from '@nestjs/common';

import {
  WORKSPACE_ACCESS_DENIAL,
  WorkspaceAccessResolver,
  type WorkspaceAccessResult,
} from '#/core/tenancy/index.js';

import { WorkspaceAccessCacheService } from '../cache/workspace-access.cache.js';
import { MEMBERSHIP_STATUS_ACCESS, WORKSPACE_STATUS_ACCESS } from '../constants/index.js';
import { WorkspaceMemberRepository, WorkspaceRepository } from '../repositories/index.js';

@Injectable()
export class WorkspaceAccessService extends WorkspaceAccessResolver {
  constructor(
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly memberRepo: WorkspaceMemberRepository,
    private readonly accessCache: WorkspaceAccessCacheService,
  ) {
    super();
  }

  /**
   * Membership is judged before the workspace, so only a member learns a
   * workspace's status: to anyone else a suspended or pending workspace is
   * indistinguishable from one that does not exist.
   */
  override async resolve(workspaceId: string, userId: string): Promise<WorkspaceAccessResult> {
    const [workspace, membership] = await Promise.all([
      this.accessCache.rememberWorkspace(workspaceId, () =>
        this.workspaceRepo.findAccessSnapshot(workspaceId),
      ),
      this.accessCache.rememberMembership(workspaceId, userId, () =>
        this.memberRepo.findAccessSnapshot(workspaceId, userId),
      ),
    ]);

    if (workspace === null || membership === null) {
      return { ok: false, reason: WORKSPACE_ACCESS_DENIAL.NOT_A_MEMBER };
    }

    const membershipDenial = MEMBERSHIP_STATUS_ACCESS[membership.status];

    if (membershipDenial !== null) {
      return { ok: false, reason: membershipDenial };
    }

    const workspaceDenial = WORKSPACE_STATUS_ACCESS[workspace.status];

    if (workspaceDenial !== null) {
      return { ok: false, reason: workspaceDenial };
    }

    return { ok: true, memberId: membership.memberId };
  }
}
