import { Module } from '@nestjs/common';

import { AdminWorkspaceController } from './controllers/admin-workspace.controller.js';
import { MyWorkspacesController } from './controllers/my-workspaces.controller.js';
import { WorkspaceController } from './controllers/workspace.controller.js';
import {
  AdminWorkspaceRepository,
  WorkspaceMemberRepository,
  WorkspaceRepository,
} from './repositories/index.js';
import { AdminWorkspaceService } from './services/admin-workspace.service.js';
import { WorkspaceService } from './services/workspace.service.js';

@Module({
  controllers: [WorkspaceController, MyWorkspacesController, AdminWorkspaceController],
  providers: [
    WorkspaceRepository,
    WorkspaceMemberRepository,
    AdminWorkspaceRepository,
    WorkspaceService,
    AdminWorkspaceService,
  ],
})
export class WorkspacesModule {}
