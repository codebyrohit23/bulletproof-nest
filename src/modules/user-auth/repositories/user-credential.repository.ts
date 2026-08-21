import { Injectable } from '@nestjs/common';
import type { UserCredential } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

@Injectable()
export class UserCredentialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserCredential | null> {
    return this.prisma.db.userCredential.findUnique({ where: { userId } });
  }

  async create(userId: string, passwordHash: string): Promise<UserCredential> {
    return this.prisma.db.userCredential.create({
      data: { userId, passwordHash },
    });
  }

  /**
   * Sets the password, whether or not one was set before.
   *
   * Exists for re-registration on a still-pending account: the person is
   * retrying and may well be typing a different password than the one they
   * abandoned, and the row may or may not already exist depending on how far
   * the first attempt got.
   *
   * `passwordChangedAt` is bumped on update because sessions and reset tokens
   * are validated against it — a password that silently changed without moving
   * that timestamp would leave anything issued under the old one still valid.
   *
   * **Only safe before the account is verified.** Nothing here proves the
   * caller owns the account, so on an `ACTIVE` user this would be account
   * takeover by re-registration. The state check in `UserAuthService` is what
   * makes it safe, not anything in this method.
   */
  async upsert(userId: string, passwordHash: string): Promise<UserCredential> {
    return this.prisma.db.userCredential.upsert({
      where: { userId },
      create: { userId, passwordHash },
      update: { passwordHash, passwordChangedAt: new Date() },
    });
  }
}
