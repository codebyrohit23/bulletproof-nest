import { Injectable } from '@nestjs/common';
import type { UserCredential } from '@prisma/client';

import { PasswordService } from '#/core/security/index.js';

import { UserCredentialRepository } from '../repositories/index.js';

@Injectable()
export class UserCredentialService {
  constructor(
    private readonly credentialRepo: UserCredentialRepository,

    private readonly passwordService: PasswordService,
  ) {}

  async createCredential(userId: string, password: string): Promise<UserCredential> {
    const passwordHash = await this.passwordService.hash(password);

    return this.credentialRepo.create(userId, passwordHash);
  }

  async setCredential(userId: string, password: string): Promise<UserCredential> {
    const passwordHash = await this.passwordService.hash(password);

    return this.credentialRepo.upsert(userId, passwordHash);
  }
}
