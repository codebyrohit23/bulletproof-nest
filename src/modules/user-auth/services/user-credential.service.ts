import { BadRequestException, Injectable } from '@nestjs/common';
import type { UserCredential } from '@prisma/client';

import { PasswordService } from '#/core/security/index.js';
import { USER_AUTH_ERROR_MESSAGE } from '#/modules/user-auth/constants/user-auth.errors.js';

import { UserCredentialRepository } from '../repositories/index.js';

@Injectable()
export class UserCredentialService {
  constructor(
    private readonly credentialRepo: UserCredentialRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async findCredentialByUserId(userId: string): Promise<UserCredential | null> {
    return this.credentialRepo.findByUserId(userId);
  }

  async createCredential(userId: string, password: string): Promise<UserCredential> {
    const passwordHash = await this.passwordService.hash(password);

    return this.credentialRepo.create(userId, passwordHash);
  }

  /**
   * Sets a password whether or not one is already stored.
   *
   * Separate from `createCredential`, which inserts and fails on a second call.
   * The distinction is not cosmetic: registration must never silently overwrite
   * an existing password, and a reset must never fail because one is already
   * there.
   *
   * No caller yet. It is what password reset will use, and it is kept rather
   * than deleted because rediscovering "insert versus upsert is a security
   * decision, not a convenience" is exactly the kind of thing that gets rewritten
   * as a blind `create` the second time around.
   */
  async setCredential(userId: string, password: string): Promise<UserCredential> {
    const passwordHash = await this.passwordService.hash(password);

    return this.credentialRepo.upsert(userId, passwordHash);
  }

  async verifyPassword(userId: string, password: string, passwordHash: string) {
    if (!(await this.passwordService.verify(passwordHash, password))) {
      throw new BadRequestException(USER_AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS);
    }

    await this.upgradeHashIfNeeded(userId, password, passwordHash);
  }

  private async upgradeHashIfNeeded(
    userId: string,
    password: string,
    currentHash: string,
  ): Promise<void> {
    const shouldRehash = this.passwordService.needsRehash(currentHash);

    if (!shouldRehash) {
      return;
    }

    const passwordHash = await this.passwordService.hash(password);

    await this.credentialRepo.rehashPassword(userId, passwordHash);
  }
}
