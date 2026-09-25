import { Injectable } from '@nestjs/common';
import { PasswordResetTokenStatus, type UserPasswordResetToken } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

import { USER_PASSWORD_RESET_TOKEN_TTL_MS } from '../constants/index.js';
import type {
  CreatePasswordResetTokenInput,
  PasswordResetTokenWithUser,
} from '../interfaces/index.js';

@Injectable()
export class UserPasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async retireActive(userId: string): Promise<void> {
    const now = new Date();

    const live = { userId, status: PasswordResetTokenStatus.ACTIVE };

    await this.prisma.db.userPasswordResetToken.updateMany({
      where: { ...live, expiresAt: { lte: now } },
      data: { status: PasswordResetTokenStatus.EXPIRED, resolvedAt: now },
    });

    await this.prisma.db.userPasswordResetToken.updateMany({
      where: live,
      data: { status: PasswordResetTokenStatus.SUPERSEDED, resolvedAt: now },
    });
  }

  async create(input: CreatePasswordResetTokenInput): Promise<UserPasswordResetToken> {
    return this.prisma.db.userPasswordResetToken.create({
      data: {
        userId: input.userId,
        tokenHash: input.tokenHash,
        expiresAt: new Date(Date.now() + USER_PASSWORD_RESET_TOKEN_TTL_MS),
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<PasswordResetTokenWithUser | null> {
    return this.prisma.db.userPasswordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        userId: true,
        status: true,
        expiresAt: true,
        user: { select: { status: true } },
      },
    });
  }

  async markConsumed(id: string): Promise<boolean> {
    return this.resolve(id, PasswordResetTokenStatus.CONSUMED);
  }

  async markExpired(id: string): Promise<void> {
    await this.resolve(id, PasswordResetTokenStatus.EXPIRED);
  }

  async deleteExpiredBefore(cutoff: Date): Promise<number> {
    const { count } = await this.prisma.db.userPasswordResetToken.deleteMany({
      where: { expiresAt: { lt: cutoff } },
    });

    return count;
  }

  private async resolve(id: string, status: PasswordResetTokenStatus): Promise<boolean> {
    const { count } = await this.prisma.db.userPasswordResetToken.updateMany({
      where: { id, status: PasswordResetTokenStatus.ACTIVE },
      data: { status, resolvedAt: new Date() },
    });

    return count > 0;
  }
}
