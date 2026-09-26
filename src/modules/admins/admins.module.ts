import { Module } from '@nestjs/common';

import { AdminProfileController } from './controllers/admin-profile.controller.js';
import { AdminRepository } from './repositories/index.js';
import { AdminSeeder } from './seeds/admin.seeder.js';
import { AdminService } from './services/admin.service.js';

@Module({
  controllers: [AdminProfileController],
  providers: [AdminRepository, AdminService, AdminSeeder],
  exports: [AdminService, AdminSeeder],
})
export class AdminsModule {}
