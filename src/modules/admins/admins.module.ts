import { Module } from '@nestjs/common';

import { AdminRepository } from './repositories/index.js';
import { AdminSeeder } from './seeds/admin.seeder.js';
import { AdminService } from './services/admin.service.js';

@Module({
  providers: [AdminRepository, AdminService, AdminSeeder],
  exports: [AdminService, AdminSeeder],
})
export class AdminsModule {}
