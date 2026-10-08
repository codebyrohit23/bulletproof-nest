import { Module } from '@nestjs/common';

import { AdminPermissionRepository } from './repositories/index.js';
import { AdminPermissionSeeder } from './seeds/admin-permission.seeder.js';

/** What `SeedModule` imports — no `CacheService`, so the seed script needs no Redis. */
@Module({
  providers: [AdminPermissionRepository, AdminPermissionSeeder],
  exports: [AdminPermissionSeeder],
})
export class AdminRolesSeedModule {}
