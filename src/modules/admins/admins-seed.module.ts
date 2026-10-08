import { Module } from '@nestjs/common';

import { AdminRepository } from './repositories/index.js';
import { AdminSeeder } from './seeds/admin.seeder.js';
import { AdminService } from './services/admin.service.js';

/**
 * What `SeedModule` imports. Separate from `AdminsModule`, which caches
 * through `CacheService` and so needs Redis; the seed script runs without it.
 */
@Module({
  providers: [AdminRepository, AdminService, AdminSeeder],
  exports: [AdminSeeder],
})
export class AdminsSeedModule {}
