import { Module } from '@nestjs/common';

import { AdminPermissionResolver } from '#/core/permissions/index.js';
import { AdminRolesModule } from '#/modules/admin-roles/index.js';
import { FilesModule } from '#/modules/files/index.js';

import { AdminGrantSubjectCacheService } from './cache/admin-grant-subject.cache.js';
import { AdminAccessController } from './controllers/admin-access.controller.js';
import { AdminProfileController } from './controllers/admin-profile.controller.js';
import { AdminRepository } from './repositories/index.js';
import { AdminAccessViewService } from './services/admin-access-view.service.js';
import { AdminGrantService } from './services/admin-grant.service.js';
import { AdminProfileService } from './services/admin-profile.service.js';
import { AdminService } from './services/admin.service.js';

@Module({
  imports: [AdminRolesModule, FilesModule],
  controllers: [AdminProfileController, AdminAccessController],
  providers: [
    AdminRepository,
    AdminService,
    AdminProfileService,
    AdminGrantSubjectCacheService,
    AdminGrantService,
    AdminAccessViewService,
    { provide: AdminPermissionResolver, useExisting: AdminGrantService },
  ],
  exports: [AdminService, AdminPermissionResolver],
})
export class AdminsModule {}
