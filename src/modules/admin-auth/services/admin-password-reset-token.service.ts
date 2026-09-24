import { Injectable } from '@nestjs/common';
import { PasswordResetTokenStatus } from '@prisma/client';

import { TokenService } from '#/core/security/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';

import {
  ADMIN_PASSWORD_RESET_TOKEN_OUTCOME,
  type AdminPasswordResetTokenVerification,
  type IssuedAdminPasswordResetToken,
} from '../interfaces/index.js';
import { AdminPasswordResetTokenRepository } from '../repositories/index.js';

/**
 * Only the hash is stored. Issuing retires whatever was live, so an admin who
 * verifies twice holds one working token — the newest.
 */
@Injectable()
export class AdminPasswordResetTokenService {
  constructor(
    private readonly resetTokenRepo: AdminPasswordResetTokenRepository,
    private readonly tokenService: TokenService,
    private readonly transaction: TransactionService,
  ) {}

  async issue(adminId: string): Promise<IssuedAdminPasswordResetToken> {
    const token = this.tokenService.generate();

    const record = await this.transaction.run(async () => {
      await this.resetTokenRepo.retireActive(adminId);

      return this.resetTokenRepo.create({ adminId, tokenHash: this.tokenService.hash(token) });
    });

    return { token, expiresAt: record.expiresAt };
  }

  async verify(token: string): Promise<AdminPasswordResetTokenVerification> {
    const record = await this.resetTokenRepo.findByTokenHash(this.tokenService.hash(token));

    if (record === null) {
      return { outcome: ADMIN_PASSWORD_RESET_TOKEN_OUTCOME.UNKNOWN };
    }

    if (record.status === PasswordResetTokenStatus.CONSUMED) {
      return { outcome: ADMIN_PASSWORD_RESET_TOKEN_OUTCOME.CONSUMED, token: record };
    }

    if (record.status === PasswordResetTokenStatus.SUPERSEDED) {
      return { outcome: ADMIN_PASSWORD_RESET_TOKEN_OUTCOME.SUPERSEDED, token: record };
    }

    if (
      record.status === PasswordResetTokenStatus.EXPIRED ||
      record.expiresAt.getTime() <= Date.now()
    ) {
      await this.resetTokenRepo.markExpired(record.id);

      return { outcome: ADMIN_PASSWORD_RESET_TOKEN_OUTCOME.EXPIRED, token: record };
    }

    return { outcome: ADMIN_PASSWORD_RESET_TOKEN_OUTCOME.VALID, token: record };
  }

  async consume(id: string): Promise<boolean> {
    return this.resetTokenRepo.markConsumed(id);
  }
}
