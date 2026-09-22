import { Injectable } from '@nestjs/common';
import type { TokenRevokeReason } from '@prisma/client';

import { TokenService } from '#/core/security/index.js';

import type { IssuedAdminRefreshToken } from '../interfaces/index.js';
import { AdminRefreshTokenRepository } from '../repositories/index.js';

@Injectable()
export class AdminRefreshTokenService {
  constructor(
    private readonly refreshTokenRepo: AdminRefreshTokenRepository,
    private readonly tokenService: TokenService,
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

  async revokeSessionTokens(
    sessionId: string | readonly string[],
    reason: TokenRevokeReason,
  ): Promise<number> {
    const sessionIds = typeof sessionId === 'string' ? [sessionId] : sessionId;

    return this.refreshTokenRepo.revokeAllForSessions(sessionIds, reason);
  }
}
