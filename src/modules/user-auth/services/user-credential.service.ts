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

  async setCredential(userId: string, password: string): Promise<UserCredential> {
    const passwordHash = await this.passwordService.hash(password);

    return this.credentialRepo.upsert(userId, passwordHash);
  }

  /**
   * Hashes against a dummy before refusing, so an unknown address costs the
   * same as a wrong password and login cannot be timed to enumerate accounts.
   * Returned rather than thrown so the caller keeps its type narrowing.
   */
  async invalidCredentialsError(
    password: string,
    failureMessage: string = USER_AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS,
  ): Promise<BadRequestException> {
    await this.passwordService.verify(null, password);

    return new BadRequestException(failureMessage);
  }

  async verifyPassword(
    userId: string,
    password: string,
    passwordHash: string,
    failureMessage: string = USER_AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS,
  ) {
    if (!(await this.passwordService.verify(passwordHash, password))) {
      throw new BadRequestException(failureMessage);
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
