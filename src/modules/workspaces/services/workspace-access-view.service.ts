import { Injectable, NotFoundException } from '@nestjs/common';

import {
  WorkspacePermissionResolver,
  type WorkspaceGrantSubject,
} from '#/core/permissions/index.js';
import { WorkspaceRoleService } from '#/modules/workspace-roles/index.js';

import { WORKSPACE_ERROR_MESSAGE } from '../constants/index.js';
import type { WorkspaceAccess } from '../dto/index.js';

/**
 * `GET /workspace/access`: the caller's grant, in the shape a client renders
 * from. The grant comes from the same resolver the guard uses, so what the UI
 * shows and what the API allows are one answer.
 */
@Injectable()
export class WorkspaceAccessViewService {
  constructor(
    private readonly resolver: WorkspacePermissionResolver,
    private readonly roleService: WorkspaceRoleService,
  ) {}

  async getAccess(subject: WorkspaceGrantSubject): Promise<WorkspaceAccess> {
    const grant = await this.resolver.resolve(subject);

    /* The tenant guard admitted the request a moment ago; null means the membership changed since. */
    if (grant === null) {
      throw new NotFoundException(WORKSPACE_ERROR_MESSAGE.WORKSPACE_NOT_FOUND);
    }

    const roles = await this.roleService.findSummaries(grant.roleIds);

    return {
      workspaceId: subject.workspaceId,
      member: { id: subject.memberId, isOwner: grant.isOwner },
      roles: roles.map((role) => ({
        id: role.id,
        key: role.key,
        name: role.name,
        isSystem: role.isSystem,
      })),
      permissions: [...grant.permissions].sort(),
    };
  }
}
