import { Module } from '@nestjs/common';

import { AdminRoleGrantsCacheService } from './cache/admin-role-grants.cache.js';
import { AdminRoleRepository } from './repositories/index.js';
import { AdminRoleGrantsService } from './services/admin-role-grants.service.js';
import { AdminRoleService } from './services/admin-role.service.js';

/**
 * Admin roles and what they grant. `AdminsModule` imports it, because that
 * module knows which roles an admin holds; this one never reads admins.
 */
@Module({
  providers: [
    AdminRoleRepository,
    AdminRoleGrantsCacheService,
    AdminRoleGrantsService,
    AdminRoleService,
  ],
  exports: [AdminRoleGrantsService, AdminRoleService],
})
export class AdminRolesModule {}
