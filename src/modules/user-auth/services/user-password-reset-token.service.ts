import { Injectable } from '@nestjs/common';
import { PasswordResetTokenStatus } from '@prisma/client';

import { TokenService } from '#/core/security/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';

import {
  PASSWORD_RESET_TOKEN_OUTCOME,
  type IssuedPasswordResetToken,
  type PasswordResetTokenVerification,
} from '../interfaces/index.js';
import { UserPasswordResetTokenRepository } from '../repositories/index.js';

@Injectable()
export class UserPasswordResetTokenService {
  constructor(
    private readonly resetTokenRepo: UserPasswordResetTokenRepository,
    private readonly tokenService: TokenService,
    private readonly transaction: TransactionService,
  ) {}

  async issue(userId: string): Promise<IssuedPasswordResetToken> {
    const token = this.tokenService.generate();

    const record = await this.transaction.run(async () => {
      await this.resetTokenRepo.retireActive(userId);

      return this.resetTokenRepo.create({ userId, tokenHash: this.tokenService.hash(token) });
    });

    return { token, expiresAt: record.expiresAt };
  }

  async verify(token: string): Promise<PasswordResetTokenVerification> {
    const record = await this.resetTokenRepo.findByTokenHash(this.tokenService.hash(token));

    if (record === null) {
      return { outcome: PASSWORD_RESET_TOKEN_OUTCOME.UNKNOWN };
    }

    if (record.status === PasswordResetTokenStatus.CONSUMED) {
      return { outcome: PASSWORD_RESET_TOKEN_OUTCOME.CONSUMED, token: record };
    }

    if (record.status === PasswordResetTokenStatus.SUPERSEDED) {
      return { outcome: PASSWORD_RESET_TOKEN_OUTCOME.SUPERSEDED, token: record };
    }

    if (
      record.status === PasswordResetTokenStatus.EXPIRED ||
      record.expiresAt.getTime() <= Date.now()
    ) {
      await this.resetTokenRepo.markExpired(record.id);

      return { outcome: PASSWORD_RESET_TOKEN_OUTCOME.EXPIRED, token: record };
    }

    return { outcome: PASSWORD_RESET_TOKEN_OUTCOME.VALID, token: record };
  }

  async consume(id: string): Promise<boolean> {
    return this.resetTokenRepo.markConsumed(id);
  }

  async purgeExpired(cutoff: Date): Promise<number> {
    return this.resetTokenRepo.deleteExpiredBefore(cutoff);
  }
}
