import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { AUTH_ERROR_MESSAGE, AUTH_FAILURE_REASON } from '#/core/auth/index.js';
import { RequestContextService } from '#/core/context/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';

import { UserCacheService } from '../cache/user.cache.js';
import { USER_ERROR_MESSAGE, USERS_LOG_CONTEXT } from '../constants/index.js';
import type { UpdateProfileInput, UserProfile } from '../dto/index.js';
import type { CreateUserInput, UserSnapshot } from '../interfaces/index.js';
import { UserRepository } from '../repositories/index.js';
import { toUpdateUserInput, toUserProfile } from '../utils/index.js';

@Injectable()
export class UserService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly userRepo: UserRepository,
    private readonly userCache: UserCacheService,
    private readonly transaction: TransactionService,
    private readonly requestContext: RequestContextService,
  ) {}

  async createUser(payload: CreateUserInput) {
    return this.userRepo.create(payload);
  }

  async getUserById(id: string): Promise<UserSnapshot | null> {
    return this.userCache.remember(id, () => this.userRepo.findSnapshotById(id));
  }

  async getProfile(): Promise<UserProfile> {
    const userId = this.requireUserId('get-profile');

    const user = await this.getUserById(userId);

    if (user === null) {
      throw new NotFoundException(USER_ERROR_MESSAGE.USER_NOT_FOUND);
    }

    return toUserProfile(user);
  }

  async updateProfile(payload: UpdateProfileInput): Promise<UserProfile> {
    const userId = this.requireUserId('update-profile');

    const user = await this.userRepo.update(userId, toUpdateUserInput(payload));

    await this.evictAfterCommit(userId);

    return toUserProfile(user);
  }

  private async evictAfterCommit(userId: string): Promise<void> {
    await this.transaction.runAfterCommit(async () => {
      await this.userCache.invalidate(userId);
    });
  }

  private requireUserId(operation: string): string {
    const userId = this.requestContext.userId;

    if (userId === undefined) {
      this.logger.warn('Handled a request that reached a guarded route with no identity', {
        context: USERS_LOG_CONTEXT,
        operation,
        metadata: { reason: AUTH_FAILURE_REASON.IDENTITY_MISSING },
      });

      throw new UnauthorizedException(AUTH_ERROR_MESSAGE.UNAUTHORIZED);
    }

    return userId;
  }
}
