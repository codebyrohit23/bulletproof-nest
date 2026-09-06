import { Injectable } from '@nestjs/common';
import {
  VerificationCodeStatus,
  type IdentifierType,
  type VerificationCode,
  type VerificationPurpose,
} from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';
import { normalizeIdentifier } from '#/shared/utils/identifier.util.js';

import { VERIFICATION_CODE_TTL_MS } from '../constants/index.js';
import type { IssueVerificationCodeInput } from '../interfaces/index.js';

@Injectable()
export class VerificationCodeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async retireActive(
    identifierType: IdentifierType,
    identifierValue: string,
    purpose: VerificationPurpose,
  ): Promise<void> {
    const now = new Date();

    const live = {
      identifierValue: normalizeIdentifier(identifierType, identifierValue),
      identifierType,
      purpose,
      status: VerificationCodeStatus.ACTIVE,
    };

    await this.prisma.db.verificationCode.updateMany({
      where: { ...live, expiresAt: { lte: now } },
      data: { status: VerificationCodeStatus.EXPIRED, resolvedAt: now, codeHash: null },
    });

    await this.prisma.db.verificationCode.updateMany({
      where: live,
      data: { status: VerificationCodeStatus.SUPERSEDED, resolvedAt: now, codeHash: null },
    });
  }

  async create(input: IssueVerificationCodeInput): Promise<VerificationCode> {
    return this.prisma.db.verificationCode.create({
      data: {
        identifierValue: normalizeIdentifier(input.identifierType, input.identifierValue),
        identifierType: input.identifierType,
        purpose: input.purpose,
        codeHash: input.codeHash,
        expiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
      },
    });
  }

  async findActive(
    identifierType: IdentifierType,
    identifierValue: string,
    purpose: VerificationPurpose,
  ): Promise<VerificationCode | null> {
    return this.prisma.db.verificationCode.findFirst({
      where: {
        identifierValue: normalizeIdentifier(identifierType, identifierValue),
        identifierType,
        purpose,
        status: VerificationCodeStatus.ACTIVE,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordFailedAttempt(id: string, maxAttempts: number): Promise<boolean> {
    await this.prisma.db.verificationCode.updateMany({
      where: { id, status: VerificationCodeStatus.ACTIVE },
      data: { attempts: { increment: 1 } },
    });

    const { count } = await this.prisma.db.verificationCode.updateMany({
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
    const { count } = await this.prisma.db.verificationCode.updateMany({
      where: { id, status: VerificationCodeStatus.ACTIVE },
      data: { status, resolvedAt: new Date(), codeHash: null },
    });

    return count > 0;
  }
}
