import { Injectable } from '@nestjs/common';

import type { AdminSnapshot, CreateAdminInput } from '../interfaces/index.js';
import { AdminRepository } from '../repositories/index.js';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepo: AdminRepository) {}

  async createAdmin(input: CreateAdminInput): Promise<AdminSnapshot> {
    return this.adminRepo.create(input);
  }

  async getAdminById(id: string): Promise<AdminSnapshot | null> {
    return this.adminRepo.findSnapshotById(id);
  }

  async findByEmail(email: string): Promise<AdminSnapshot | null> {
    return this.adminRepo.findSnapshotByEmail(email);
  }

  async markEmailVerified(id: string): Promise<void> {
    await this.adminRepo.markEmailVerified(id);
  }

  async hasAny(): Promise<boolean> {
    return (await this.adminRepo.count()) > 0;
  }

  async lockBootstrap(): Promise<void> {
    return this.adminRepo.lockBootstrap();
  }
}
