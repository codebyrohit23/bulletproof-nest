import { Module } from '@nestjs/common';

import { WorkspaceAccessResolver } from '#/core/tenancy/index.js';

import { WorkspaceAccessCacheService } from './cache/workspace-access.cache.js';
import { AdminWorkspaceController } from './controllers/admin-workspace.controller.js';
import { CurrentWorkspaceController } from './controllers/current-workspace.controller.js';
import { MyWorkspacesController } from './controllers/my-workspaces.controller.js';
import { WorkspaceController } from './controllers/workspace.controller.js';
import {
  AdminWorkspaceRepository,
  WorkspaceMemberRepository,
  WorkspaceRepository,
} from './repositories/index.js';
import { AdminWorkspaceService } from './services/admin-workspace.service.js';
import { WorkspaceAccessService } from './services/workspace-access.service.js';
import { WorkspaceService } from './services/workspace.service.js';

@Module({
  controllers: [
    WorkspaceController,
    MyWorkspacesController,
    CurrentWorkspaceController,
    AdminWorkspaceController,
  ],
  providers: [
    WorkspaceRepository,
    WorkspaceMemberRepository,
    AdminWorkspaceRepository,
    WorkspaceAccessCacheService,
    WorkspaceAccessService,
    WorkspaceService,
    AdminWorkspaceService,
    { provide: WorkspaceAccessResolver, useExisting: WorkspaceAccessService },
  ],
  exports: [WorkspaceAccessResolver],
})
export class WorkspacesModule {}
