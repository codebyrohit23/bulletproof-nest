import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FilePurpose } from '@prisma/client';

import { TransactionService } from '#/infrastructure/database/prisma/index.js';
import { FilesService, adminUploader } from '#/modules/files/index.js';

import { ADMIN_ERROR_MESSAGE } from '../constants/index.js';
import type { AdminProfile, UpdateAdminProfileInput } from '../dto/index.js';
import type { AdminSnapshot } from '../interfaces/index.js';
import { toAdminProfile, toUpdateAdminInput } from '../mappers/index.js';
import { AdminRepository } from '../repositories/index.js';

@Injectable()
export class AdminProfileService {
  constructor(
    private readonly adminRepo: AdminRepository,
    private readonly transaction: TransactionService,
    private readonly files: FilesService,
  ) {}

  async getProfile(adminId: string): Promise<AdminProfile> {
    const admin = await this.findOrThrow(adminId);

    return toAdminProfile(admin, await this.files.attachedImage(admin.avatarFileId));
  }

  async updateProfile(adminId: string, payload: UpdateAdminProfileInput): Promise<AdminProfile> {
    await this.transaction.run(async () => {
      const admin = await this.findOrThrow(adminId);
      const names = toUpdateAdminInput(payload);

      if (Object.keys(names).length > 0) {
        await this.adminRepo.update(adminId, names);
      }

      const next = payload.avatarFileId;

      if (next && next !== admin.avatarFileId) {
        await this.files.attach(next, {
          purpose: FilePurpose.ADMIN_AVATAR,
          uploader: adminUploader(adminId),
        });

        await this.moveAvatar(adminId, admin.avatarFileId, next);
      }
    });

    return this.getProfile(adminId);
  }

  async removeAvatar(adminId: string): Promise<AdminProfile> {
    await this.transaction.run(async () => {
      const admin = await this.findOrThrow(adminId);

      if (admin.avatarFileId) {
        await this.moveAvatar(adminId, admin.avatarFileId, null);
      }
    });

    return this.getProfile(adminId);
  }

  private async findOrThrow(adminId: string): Promise<AdminSnapshot> {
    const admin = await this.adminRepo.findSnapshotById(adminId);

    if (admin === null) {
      throw new NotFoundException(ADMIN_ERROR_MESSAGE.ADMIN_NOT_FOUND);
    }

    return admin;
  }

  private async moveAvatar(adminId: string, from: string | null, to: string | null): Promise<void> {
    if (!(await this.adminRepo.replaceAvatar(adminId, from, to))) {
      throw new ConflictException(ADMIN_ERROR_MESSAGE.AVATAR_CHANGED);
    }

    if (from !== null) {
      await this.files.release(from);
    }
  }
}
