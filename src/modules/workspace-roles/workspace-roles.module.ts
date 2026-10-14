import { Module } from '@nestjs/common';

import { WorkspaceMemberRolesCacheService } from './cache/workspace-member-roles.cache.js';
import { WorkspaceRoleGrantsCacheService } from './cache/workspace-role-grants.cache.js';
import { WorkspacePermissionController } from './controllers/workspace-permission.controller.js';
import { WorkspaceRoleController } from './controllers/workspace-role.controller.js';
import { WorkspaceMemberRoleRepository, WorkspaceRoleRepository } from './repositories/index.js';
import { WorkspaceRoleGrantsService } from './services/workspace-role-grants.service.js';
import { WorkspaceRoleService } from './services/workspace-role.service.js';

/**
 * Roles, what they grant, and which members hold them. `WorkspacesModule`
 * imports it; this module never imports that one — it owns the assignments so
 * that deleting a role can clear its holders without reaching back.
 */
@Module({
  controllers: [WorkspacePermissionController, WorkspaceRoleController],
  providers: [
    WorkspaceRoleRepository,
    WorkspaceMemberRoleRepository,
    WorkspaceRoleGrantsCacheService,
    WorkspaceMemberRolesCacheService,
    WorkspaceRoleGrantsService,
    WorkspaceRoleService,
  ],
  exports: [WorkspaceRoleGrantsService, WorkspaceRoleService],
})
export class WorkspaceRolesModule {}
