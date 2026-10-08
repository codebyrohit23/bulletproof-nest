import { Module } from '@nestjs/common';

import { AppConfigModule } from '#/config/index.js';
import { ContextModule } from '#/core/context/index.js';
import { AppLoggerModule } from '#/core/logger/index.js';
import { SeedingModule } from '#/core/seeding/index.js';
import { PrismaModule } from '#/infrastructure/database/prisma/index.js';
import { AdminPermissionSeeder, AdminRolesSeedModule } from '#/modules/admin-roles/index.js';
import { AdminSeeder, AdminsSeedModule } from '#/modules/admins/index.js';
import {
  WorkspaceDefaultRoleSeeder,
  WorkspacePermissionSeeder,
  WorkspaceRolesSeedModule,
} from '#/modules/workspace-roles/index.js';

@Module({
  imports: [
    AppConfigModule,
    ContextModule,
    AppLoggerModule,
    PrismaModule,

    SeedingModule.forRoot({
      /* The seed modules, never the runtime ones: those cache through Redis, and this script has none. */
      imports: [WorkspaceRolesSeedModule, AdminRolesSeedModule, AdminsSeedModule],

      /*
       * Reference data before bootstrap data, and each permission mirror
       * before anything that references it: the default roles' grants point
       * at workspace_permissions rows.
       */
      seeders: [
        WorkspacePermissionSeeder,
        WorkspaceDefaultRoleSeeder,
        AdminPermissionSeeder,
        AdminSeeder,
      ],
    }),
  ],
})
export class SeedModule {}
