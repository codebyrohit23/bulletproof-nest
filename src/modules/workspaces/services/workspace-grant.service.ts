import { Injectable } from '@nestjs/common';
import { MembershipStatus, WorkspaceStatus } from '@prisma/client';

import {
  WORKSPACE_PERMISSION_CATALOGUE,
  WorkspacePermissionResolver,
  type WorkspaceGrant,
  type WorkspaceGrantSubject,
} from '#/core/permissions/index.js';
import { WorkspaceRoleGrantsService } from '#/modules/workspace-roles/index.js';

import { WorkspaceAccessCacheService } from '../cache/workspace-access.cache.js';
import { WorkspaceMemberRepository, WorkspaceRepository } from '../repositories/index.js';

/** Built once: the owner's grant is the whole catalogue, and the catalogue is fixed per build. */
const EVERY_PERMISSION = new Set(WORKSPACE_PERMISSION_CATALOGUE.keys);

/**
 * What a member may do in a workspace — the answer `PermissionGuard` and
 * `GET /workspace/access` both use.
 *
 *   1. workspace and membership snapshots — the tenant guard read both a
 *      moment ago, so within a request they come from the memo
 *   2. the owner holds no role and every permission
 *   3. anyone else: their roles, then the union of what those roles grant
 *
 * `null` when the membership is not the one the tenant guard admitted or is no
 * longer active, or the workspace is no longer active — something changed
 * between the guards. The guard refuses it.
 */
@Injectable()
export class WorkspaceGrantService extends WorkspacePermissionResolver {
  constructor(
    private readonly workspaceRepo: WorkspaceRepository,
    private readonly memberRepo: WorkspaceMemberRepository,
    private readonly accessCache: WorkspaceAccessCacheService,
    private readonly roleGrants: WorkspaceRoleGrantsService,
  ) {
    super();
  }

  override async resolve(subject: WorkspaceGrantSubject): Promise<WorkspaceGrant | null> {
    const { workspaceId, memberId, userId } = subject;

    const [workspace, membership] = await Promise.all([
      this.accessCache.rememberWorkspace(workspaceId, () =>
        this.workspaceRepo.findAccessSnapshot(workspaceId),
      ),
      this.accessCache.rememberMembership(workspaceId, userId, () =>
        this.memberRepo.findAccessSnapshot(workspaceId, userId),
      ),
    ]);

    if (
      workspace === null ||
      workspace.status !== WorkspaceStatus.ACTIVE ||
      membership === null ||
      membership.memberId !== memberId ||
      membership.status !== MembershipStatus.ACTIVE
    ) {
      return null;
    }

    if (workspace.ownerUserId === userId) {
      return { isOwner: true, roleIds: [], permissions: EVERY_PERMISSION };
    }

    const roles = await this.accessCache.rememberMemberRoles(workspaceId, memberId, () =>
      this.memberRepo.findRoles(workspaceId, memberId),
    );

    return {
      isOwner: false,
      roleIds: roles.map((role) => role.id),
      permissions: await this.roleGrants.permissionsOf(roles),
    };
  }
}
