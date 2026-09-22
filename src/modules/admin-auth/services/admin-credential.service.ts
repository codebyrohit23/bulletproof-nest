import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PasswordService } from '#/core/security/index.js';

import { ADMIN_AUTH_ERROR_MESSAGE } from '../constants/index.js';
import { AdminCredentialRepository } from '../repositories/index.js';

@Injectable()
export class AdminCredentialService {
  constructor(
    private readonly credentialRepo: AdminCredentialRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async verifyPassword(adminId: string, password: string, passwordHash: string | null) {
    if (!(await this.passwordService.verify(passwordHash, password))) {
      throw new UnauthorizedException(ADMIN_AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS);
    }

    await this.upgradeHashIfNeeded(adminId, password, passwordHash);
  }

  async invalidCredentialsError(password: string): Promise<UnauthorizedException> {
    await this.passwordService.verify(null, password);

    return new UnauthorizedException(ADMIN_AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS);
  }

  async findByAdminId(adminId: string) {
    return this.credentialRepo.findByAdminId(adminId);
  }

  private async upgradeHashIfNeeded(
    adminId: string,
    password: string,
    currentHash: string | null,
  ): Promise<void> {
    if (currentHash === null || !this.passwordService.needsRehash(currentHash)) {
      return;
    }

    await this.credentialRepo.rehashPassword(adminId, await this.passwordService.hash(password));
  }
}
