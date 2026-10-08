import { Module } from '@nestjs/common';

import { WorkspacePermissionRepository, WorkspaceRoleRepository } from './repositories/index.js';
import { WorkspaceDefaultRoleSeeder } from './seeds/workspace-default-role.seeder.js';
import { WorkspacePermissionSeeder } from './seeds/workspace-permission.seeder.js';

/**
 * What `SeedModule` imports. Separate from the runtime module because that one
 * caches through `CacheService`, which needs Redis, and the seed script runs
 * without it.
 */
@Module({
  providers: [
    WorkspacePermissionRepository,
    WorkspaceRoleRepository,
    WorkspacePermissionSeeder,
    WorkspaceDefaultRoleSeeder,
  ],
  exports: [WorkspacePermissionSeeder, WorkspaceDefaultRoleSeeder],
})
export class WorkspaceRolesSeedModule {}
