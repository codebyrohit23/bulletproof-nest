import { Injectable } from '@nestjs/common';
import { PasswordResetTokenStatus, type AdminPasswordResetToken } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

import { ADMIN_PASSWORD_RESET_TOKEN_TTL_MS } from '../constants/index.js';
import type {
  AdminPasswordResetTokenRecord,
  CreateAdminPasswordResetTokenInput,
} from '../interfaces/index.js';

@Injectable()
export class AdminPasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async retireActive(adminId: string): Promise<void> {
    const now = new Date();

    const live = { adminId, status: PasswordResetTokenStatus.ACTIVE };

    await this.prisma.db.adminPasswordResetToken.updateMany({
      where: { ...live, expiresAt: { lte: now } },
      data: { status: PasswordResetTokenStatus.EXPIRED, resolvedAt: now },
    });

    await this.prisma.db.adminPasswordResetToken.updateMany({
      where: live,
      data: { status: PasswordResetTokenStatus.SUPERSEDED, resolvedAt: now },
    });
  }

  async create(input: CreateAdminPasswordResetTokenInput): Promise<AdminPasswordResetToken> {
    return this.prisma.db.adminPasswordResetToken.create({
      data: {
        adminId: input.adminId,
        tokenHash: input.tokenHash,
        expiresAt: new Date(Date.now() + ADMIN_PASSWORD_RESET_TOKEN_TTL_MS),
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<AdminPasswordResetTokenRecord | null> {
    return this.prisma.db.adminPasswordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, adminId: true, status: true, expiresAt: true },
    });
  }

  /** `false` when the token was no longer ACTIVE — a concurrent redemption won. */
  async markConsumed(id: string): Promise<boolean> {
    return this.resolve(id, PasswordResetTokenStatus.CONSUMED);
  }

  async markExpired(id: string): Promise<void> {
    await this.resolve(id, PasswordResetTokenStatus.EXPIRED);
  }

  private async resolve(id: string, status: PasswordResetTokenStatus): Promise<boolean> {
    const { count } = await this.prisma.db.adminPasswordResetToken.updateMany({
      where: { id, status: PasswordResetTokenStatus.ACTIVE },
      data: { status, resolvedAt: new Date() },
    });

    return count > 0;
  }
}
