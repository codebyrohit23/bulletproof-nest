import { Injectable } from '@nestjs/common';
import { TokenRevokeReason } from '@prisma/client';

import { TokenService } from '#/core/security/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';

import {
  ADMIN_REFRESH_TOKEN_OUTCOME,
  type AdminRefreshTokenVerification,
  type AdminRefreshTokenWithSession,
  type IssuedAdminRefreshToken,
} from '../interfaces/index.js';
import { AdminRefreshTokenRepository } from '../repositories/index.js';

@Injectable()
export class AdminRefreshTokenService {
  constructor(
    private readonly refreshTokenRepo: AdminRefreshTokenRepository,
    private readonly tokenService: TokenService,
    private readonly transaction: TransactionService,
  ) {}

  async issue(sessionId: string, adminId: string): Promise<IssuedAdminRefreshToken> {
    const token = this.tokenService.generate();

    const record = await this.refreshTokenRepo.create({
      adminId,
      sessionId,
      tokenHash: this.tokenService.hash(token),
    });

    return { token, expiresAt: record.expiresAt };
  }

  async verify(token: string): Promise<AdminRefreshTokenVerification> {
    const record = await this.refreshTokenRepo.findByTokenHash(this.tokenService.hash(token));

    if (record === null) {
      return { outcome: ADMIN_REFRESH_TOKEN_OUTCOME.UNKNOWN };
    }

    if (record.revokedAt !== null) {
      return { outcome: ADMIN_REFRESH_TOKEN_OUTCOME.REUSED, token: record };
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      return { outcome: ADMIN_REFRESH_TOKEN_OUTCOME.EXPIRED, token: record };
    }

    return { outcome: ADMIN_REFRESH_TOKEN_OUTCOME.VALID, token: record };
  }

  /** `null` when a concurrent refresh spent the token first. */
  async rotate(current: AdminRefreshTokenWithSession): Promise<IssuedAdminRefreshToken | null> {
    return this.transaction.run(async () => {
      const spent = await this.refreshTokenRepo.revoke(current.id, TokenRevokeReason.ROTATED);

      if (!spent) {
        return null;
      }

      return this.issue(current.sessionId, current.adminId);
    });
  }

  async revokeSessionTokens(
    sessionId: string | readonly string[],
    reason: TokenRevokeReason,
  ): Promise<number> {
    const sessionIds = typeof sessionId === 'string' ? [sessionId] : sessionId;

    return this.refreshTokenRepo.revokeAllForSessions(sessionIds, reason);
  }
}
