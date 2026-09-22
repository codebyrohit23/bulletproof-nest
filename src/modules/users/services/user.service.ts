import { Injectable, NotFoundException } from '@nestjs/common';

import { TransactionService } from '#/infrastructure/database/prisma/index.js';

import { UserCacheService } from '../cache/user.cache.js';
import { USER_ERROR_MESSAGE } from '../constants/index.js';
import type { UpdateProfileInput, UserProfile } from '../dto/index.js';
import type { CreateUserInput, UserSnapshot } from '../interfaces/index.js';
import { toUpdateUserInput, toUserProfile } from '../mappers/index.js';
import { UserRepository } from '../repositories/index.js';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly userCache: UserCacheService,
    private readonly transaction: TransactionService,
  ) {}

  async createUser(payload: CreateUserInput): Promise<UserSnapshot> {
    return this.userRepo.create(payload);
  }

  async getUserById(id: string): Promise<UserSnapshot | null> {
    return this.userCache.remember(id, () => this.userRepo.findSnapshotById(id));
  }

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.getUserById(userId);

    if (user === null) {
      throw new NotFoundException(USER_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    return toUserProfile(user);
  }

  async updateProfile(userId: string, payload: UpdateProfileInput): Promise<UserProfile> {
    const user = await this.userRepo.update(userId, toUpdateUserInput(payload));

    await this.evictAfterCommit(userId);

    return toUserProfile(user);
  }

  private async evictAfterCommit(userId: string): Promise<void> {
    await this.transaction.runAfterCommit(async () => {
      await this.userCache.invalidate(userId);
    });
  }
}
