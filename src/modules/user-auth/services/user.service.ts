import { Injectable } from '@nestjs/common';

import type { CreateUserInput } from '../interfaces/index.js';
import { UserRepository } from '../repositories/index.js';

@Injectable()
export class UserService {
  constructor(private userRepo: UserRepository) {}

  async createUser(payload: CreateUserInput) {
    return this.userRepo.create(payload);
  }

  async getUserById(id: string) {
    return this.userRepo.findById(id);
  }

  async reactivateUserAccount(id: string) {
    await this.userRepo.reactivate(id);
  }
}
