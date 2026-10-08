import { Module } from '@nestjs/common';

import { WorkspaceRoleGrantsCacheService } from './cache/workspace-role-grants.cache.js';
import { WorkspaceRoleRepository } from './repositories/index.js';
import { WorkspaceRoleGrantsService } from './services/workspace-role-grants.service.js';
import { WorkspaceRoleService } from './services/workspace-role.service.js';

/**
 * Roles and what they grant. `WorkspacesModule` imports it, because that
 * module knows which roles a member holds; this one never reads members.
 */
@Module({
  providers: [
    WorkspaceRoleRepository,
    WorkspaceRoleGrantsCacheService,
    WorkspaceRoleGrantsService,
    WorkspaceRoleService,
  ],
  exports: [WorkspaceRoleGrantsService, WorkspaceRoleService],
})
export class WorkspaceRolesModule {}
