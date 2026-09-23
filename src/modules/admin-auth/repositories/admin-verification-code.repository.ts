import { Injectable } from '@nestjs/common';
import { VerificationCodeStatus, type AdminVerificationCode } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

import { ADMIN_VERIFICATION_CODE_TTL_MS } from '../constants/index.js';
import type { AdminCodePurpose, CreateAdminVerificationCodeInput } from '../interfaces/index.js';

/**
 * Every resolution clears `codeHash`. A code that can no longer be answered
 * has no reason to keep the one thing that could answer it.
 */
@Injectable()
export class AdminVerificationCodeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async retireActive(adminId: string, purpose: AdminCodePurpose): Promise<void> {
    const now = new Date();

    const live = { adminId, purpose, status: VerificationCodeStatus.ACTIVE };

    await this.prisma.db.adminVerificationCode.updateMany({
      where: { ...live, expiresAt: { lte: now } },
      data: { status: VerificationCodeStatus.EXPIRED, resolvedAt: now, codeHash: null },
    });

    await this.prisma.db.adminVerificationCode.updateMany({
      where: live,
      data: { status: VerificationCodeStatus.SUPERSEDED, resolvedAt: now, codeHash: null },
    });
  }

  async create(input: CreateAdminVerificationCodeInput): Promise<AdminVerificationCode> {
    return this.prisma.db.adminVerificationCode.create({
      data: {
        adminId: input.adminId,
        purpose: input.purpose,
        codeHash: input.codeHash,
        expiresAt: new Date(Date.now() + ADMIN_VERIFICATION_CODE_TTL_MS),
      },
    });
  }

  async findActive(
    adminId: string,
    purpose: AdminCodePurpose,
  ): Promise<AdminVerificationCode | null> {
    return this.prisma.db.adminVerificationCode.findFirst({
      where: { adminId, purpose, status: VerificationCodeStatus.ACTIVE },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordFailedAttempt(id: string, maxAttempts: number): Promise<boolean> {
    await this.prisma.db.adminVerificationCode.updateMany({
      where: { id, status: VerificationCodeStatus.ACTIVE },
      data: { attempts: { increment: 1 } },
    });

    const { count } = await this.prisma.db.adminVerificationCode.updateMany({
      where: {
        id,
        status: VerificationCodeStatus.ACTIVE,
        attempts: { gte: maxAttempts },
      },
      data: {
        status: VerificationCodeStatus.BLOCKED,
        resolvedAt: new Date(),
        codeHash: null,
      },
    });

    return count > 0;
  }

  async markConsumed(id: string): Promise<boolean> {
    return this.resolve(id, VerificationCodeStatus.CONSUMED);
  }

  async markExpired(id: string): Promise<void> {
    await this.resolve(id, VerificationCodeStatus.EXPIRED);
  }

  async markBlocked(id: string): Promise<void> {
    await this.resolve(id, VerificationCodeStatus.BLOCKED);
  }

  private async resolve(id: string, status: VerificationCodeStatus): Promise<boolean> {
    const { count } = await this.prisma.db.adminVerificationCode.updateMany({
      where: { id, status: VerificationCodeStatus.ACTIVE },
      data: { status, resolvedAt: new Date(), codeHash: null },
    });

    return count > 0;
  }
}
