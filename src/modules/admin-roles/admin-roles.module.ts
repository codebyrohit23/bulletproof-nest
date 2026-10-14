import { Module } from '@nestjs/common';

import { AdminRoleGrantsCacheService } from './cache/admin-role-grants.cache.js';
import { AdminUserRolesCacheService } from './cache/admin-user-roles.cache.js';
import { AdminPermissionController } from './controllers/admin-permission.controller.js';
import { AdminRoleController } from './controllers/admin-role.controller.js';
import { AdminRoleRepository, AdminUserRoleRepository } from './repositories/index.js';
import { AdminRoleGrantsService } from './services/admin-role-grants.service.js';
import { AdminRoleService } from './services/admin-role.service.js';

/**
 * Admin roles, what they grant, and which admins hold them. `AdminsModule`
 * imports it; this module never imports that one — it owns the assignments so
 * that deleting a role can clear its holders without reaching back.
 */
@Module({
  controllers: [AdminPermissionController, AdminRoleController],
  providers: [
    AdminRoleRepository,
    AdminUserRoleRepository,
    AdminRoleGrantsCacheService,
    AdminUserRolesCacheService,
    AdminRoleGrantsService,
    AdminRoleService,
  ],
  exports: [AdminRoleGrantsService, AdminRoleService],
})
export class AdminRolesModule {}
