import { Injectable, NotFoundException } from '@nestjs/common';

import { ADMIN_ERROR_MESSAGE } from '../constants/index.js';
import type { AdminProfile, UpdateAdminProfileInput } from '../dto/index.js';
import type { AdminSnapshot, CreateAdminInput } from '../interfaces/index.js';
import { toAdminProfile, toUpdateAdminInput } from '../mappers/index.js';
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

  async getProfile(adminId: string): Promise<AdminProfile> {
    const admin = await this.adminRepo.findSnapshotById(adminId);

    if (admin === null) {
      throw new NotFoundException(ADMIN_ERROR_MESSAGE.ADMIN_NOT_FOUND);
    }

    return toAdminProfile(admin);
  }

  async updateProfile(adminId: string, payload: UpdateAdminProfileInput): Promise<AdminProfile> {
    const admin = await this.adminRepo.update(adminId, toUpdateAdminInput(payload));

    return toAdminProfile(admin);
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
