import { Module } from '@nestjs/common';

import { FilesModule } from '#/modules/files/index.js';

import { UserCacheService } from './cache/user.cache.js';
import { UserProfileController } from './controllers/user-profile.controller.js';
import { UserRepository } from './repositories/index.js';
import { UserService } from './services/user.service.js';

@Module({
  imports: [FilesModule],
  controllers: [UserProfileController],
  providers: [UserRepository, UserCacheService, UserService],
  exports: [UserService],
})
export class UsersModule {}
