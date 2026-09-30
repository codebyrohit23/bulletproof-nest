import { Module } from '@nestjs/common';

import { MyWorkspacesController } from './controllers/my-workspaces.controller.js';
import { WorkspaceController } from './controllers/workspace.controller.js';
import { WorkspaceMemberRepository, WorkspaceRepository } from './repositories/index.js';
import { WorkspaceService } from './services/workspace.service.js';

@Module({
  controllers: [WorkspaceController, MyWorkspacesController],
  providers: [WorkspaceRepository, WorkspaceMemberRepository, WorkspaceService],
})
export class WorkspacesModule {}
