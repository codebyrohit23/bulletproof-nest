import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FilePurpose } from '@prisma/client';

import { TransactionService } from '#/infrastructure/database/prisma/index.js';
import { FilesService, userUploader } from '#/modules/files/index.js';

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
    private readonly files: FilesService,
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

    return this.toProfile(user);
  }

  async updateProfile(userId: string, payload: UpdateProfileInput): Promise<UserProfile> {
    await this.transaction.run(async () => {
      const user = await this.findOrThrow(userId);
      const names = toUpdateUserInput(payload);

      if (Object.keys(names).length > 0) {
        await this.userRepo.update(userId, names);
      }

      const next = payload.avatarFileId;

      if (next && next !== user.avatarFileId) {
        await this.files.attach(next, {
          purpose: FilePurpose.USER_AVATAR,
          uploader: userUploader(userId),
        });

        await this.moveAvatar(userId, user.avatarFileId, next);
      }

      await this.evictAfterCommit(userId);
    });

    return this.getProfile(userId);
  }

  async removeAvatar(userId: string): Promise<UserProfile> {
    await this.transaction.run(async () => {
      const user = await this.findOrThrow(userId);

      if (user.avatarFileId) {
        await this.moveAvatar(userId, user.avatarFileId, null);
        await this.evictAfterCommit(userId);
      }
    });

    return this.getProfile(userId);
  }

  /** Read fresh, not from the cache: the transaction acts on what it reads. */
  private async findOrThrow(userId: string): Promise<UserSnapshot> {
    const user = await this.userRepo.findSnapshotById(userId);

    if (user === null) {
      throw new NotFoundException(USER_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    return user;
  }

  private async moveAvatar(userId: string, from: string | null, to: string | null): Promise<void> {
    if (!(await this.userRepo.replaceAvatar(userId, from, to))) {
      throw new ConflictException(USER_ERROR_MESSAGE.AVATAR_CHANGED);
    }

    if (from !== null) {
      await this.files.release(from);
    }
  }

  private async toProfile(user: UserSnapshot): Promise<UserProfile> {
    return toUserProfile(user, await this.files.attachedImage(user.avatarFileId));
  }

  private async evictAfterCommit(userId: string): Promise<void> {
    await this.transaction.runAfterCommit(async () => {
      await this.userCache.invalidate(userId);
    });
  }
}
