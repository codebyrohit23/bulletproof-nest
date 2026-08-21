import { Injectable } from '@nestjs/common';
import type { IdentifierType, UserIdentity } from '@prisma/client';

import type {
  CreateIdentityInput,
  UserIdentityWithUser,
  UserIdentityWithUserAndCredential,
} from '../interfaces/index.js';
import { UserIdentityRepository } from '../repositories/index.js';

@Injectable()
export class UserIdentityService {
  constructor(private identityRepo: UserIdentityRepository) {}

  public async findIdentityWithUser(
    identifierType: IdentifierType,
    identifierValue: string,
  ): Promise<UserIdentityWithUser | null> {
    return this.identityRepo.findIdentityWithUser(identifierType, identifierValue);
  }

  public async findIdentityWithUserAndCredential(
    identifierType: IdentifierType,
    identifierValue: string,
  ): Promise<UserIdentityWithUserAndCredential | null> {
    return this.identityRepo.findIdentityWithUserAndCredential(identifierType, identifierValue);
  }

  public async createIdentity(input: CreateIdentityInput): Promise<UserIdentity> {
    return this.identityRepo.create(input);
  }

  public async markVerified(id: string): Promise<void> {
    await this.identityRepo.markVerified(id);
  }
}
