import { Injectable } from '@nestjs/common';

import type { CreateUserInput } from '../interfaces/index.js';
import { UserRepository } from '../repositories/index.js';

@Injectable()
export class UserService {
  constructor(private userRepo: UserRepository) {}

  public async createUser(payload: CreateUserInput) {
    return this.userRepo.create(payload);
  }

  public async getUserById(id: string) {
    return this.userRepo.findById(id);
  }

  /**
   * Rewrites the profile of an account that has not been verified yet. A no-op
   * once the account is `ACTIVE` — see the repository for why that guard is
   * load-bearing rather than defensive.
   */
  public async updatePendingProfile(id: string, payload: CreateUserInput) {
    await this.userRepo.updatePendingProfile(id, payload);
  }

  public async activateUserAccount(id: string) {
    await this.userRepo.activate(id);
  }
}
