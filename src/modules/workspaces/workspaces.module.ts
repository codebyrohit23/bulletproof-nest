import { Module } from '@nestjs/common';

import { WorkspacePermissionResolver } from '#/core/permissions/index.js';
import { WorkspaceAccessResolver } from '#/core/tenancy/index.js';
import { WorkspaceRolesModule } from '#/modules/workspace-roles/index.js';

import { WorkspaceAccessCacheService } from './cache/workspace-access.cache.js';
import { AdminWorkspaceController } from './controllers/admin-workspace.controller.js';
import { CurrentWorkspaceController } from './controllers/current-workspace.controller.js';
import { MyWorkspacesController } from './controllers/my-workspaces.controller.js';
import { WorkspaceAccessController } from './controllers/workspace-access.controller.js';
import { WorkspaceController } from './controllers/workspace.controller.js';
import {
  AdminWorkspaceRepository,
  WorkspaceMemberRepository,
  WorkspaceRepository,
} from './repositories/index.js';
import { AdminWorkspaceService } from './services/admin-workspace.service.js';
import { WorkspaceAccessViewService } from './services/workspace-access-view.service.js';
import { WorkspaceAccessService } from './services/workspace-access.service.js';
import { WorkspaceGrantService } from './services/workspace-grant.service.js';
import { WorkspaceService } from './services/workspace.service.js';

@Module({
  imports: [WorkspaceRolesModule],
  controllers: [
    WorkspaceController,
    MyWorkspacesController,
    CurrentWorkspaceController,
    WorkspaceAccessController,
    AdminWorkspaceController,
  ],
  providers: [
    WorkspaceRepository,
    WorkspaceMemberRepository,
    AdminWorkspaceRepository,
    WorkspaceAccessCacheService,
    WorkspaceAccessService,
    WorkspaceGrantService,
    WorkspaceAccessViewService,
    WorkspaceService,
    AdminWorkspaceService,
    { provide: WorkspaceAccessResolver, useExisting: WorkspaceAccessService },
    { provide: WorkspacePermissionResolver, useExisting: WorkspaceGrantService },
  ],
  exports: [WorkspaceAccessResolver, WorkspacePermissionResolver],
})
export class WorkspacesModule {}
