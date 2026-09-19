import { Injectable } from '@nestjs/common';
import { TokenRevokeReason } from '@prisma/client';

import { TokenService } from '#/core/security/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';

import {
  REFRESH_TOKEN_OUTCOME,
  type IssuedRefreshToken,
  type RefreshTokenVerification,
  type RefreshTokenWithSession,
} from '../interfaces/index.js';
import { UserRefreshTokenRepository } from '../repositories/index.js';

@Injectable()
export class UserRefreshTokenService {
  constructor(
    private readonly refreshTokenRepo: UserRefreshTokenRepository,
    private readonly tokenService: TokenService,
    private readonly transaction: TransactionService,
  ) {}

  async issue(sessionId: string, userId: string): Promise<IssuedRefreshToken> {
    const token = this.tokenService.generate();

    const record = await this.refreshTokenRepo.create({
      userId,
      sessionId,
      tokenHash: this.tokenService.hash(token),
    });

    return { token, expiresAt: record.expiresAt };
  }

  async verify(token: string): Promise<RefreshTokenVerification> {
    const record = await this.refreshTokenRepo.findByTokenHash(this.tokenService.hash(token));

    if (record === null) {
      return { outcome: REFRESH_TOKEN_OUTCOME.UNKNOWN };
    }

    if (record.revokedAt !== null) {
      return { outcome: REFRESH_TOKEN_OUTCOME.REUSED, token: record };
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      return { outcome: REFRESH_TOKEN_OUTCOME.EXPIRED, token: record };
    }

    return { outcome: REFRESH_TOKEN_OUTCOME.VALID, token: record };
  }

  async rotate(current: RefreshTokenWithSession): Promise<IssuedRefreshToken | null> {
    return this.transaction.run(async () => {
      const spent = await this.refreshTokenRepo.revoke(current.id, TokenRevokeReason.ROTATED);

      if (!spent) {
        return null;
      }

      return this.issue(current.sessionId, current.userId);
    });
  }

  async revokeSessionTokens(
    sessionId: string | readonly string[],
    reason: TokenRevokeReason,
  ): Promise<number> {
    const sessionIds = typeof sessionId === 'string' ? [sessionId] : sessionId;

    return this.refreshTokenRepo.revokeAllForSessions(sessionIds, reason);
  }

  async purgeExpired(cutoff: Date): Promise<number> {
    return this.refreshTokenRepo.deleteExpiredBefore(cutoff);
  }
}
