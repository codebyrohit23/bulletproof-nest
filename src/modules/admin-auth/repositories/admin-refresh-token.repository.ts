import { Injectable } from '@nestjs/common';
import type { AdminRefreshToken, TokenRevokeReason } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

import { ADMIN_REFRESH_TOKEN_TTL_MS } from '../constants/index.js';
import type {
  AdminRefreshTokenWithSession,
  CreateAdminRefreshTokenInput,
} from '../interfaces/index.js';

@Injectable()
export class AdminRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAdminRefreshTokenInput): Promise<AdminRefreshToken> {
    return this.prisma.db.adminRefreshToken.create({
      data: {
        adminId: input.adminId,
        sessionId: input.sessionId,
        tokenHash: input.tokenHash,
        expiresAt: new Date(Date.now() + ADMIN_REFRESH_TOKEN_TTL_MS),
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<AdminRefreshTokenWithSession | null> {
    return this.prisma.db.adminRefreshToken.findUnique({
      where: { tokenHash },
      include: { session: true },
    });
  }

  /**
   * Guarded on `revokedAt: null` so that of two concurrent refreshes with the
   * same token exactly one gets `true` — the loser must not mint a second
   * token. See `UserRefreshTokenRepository.revoke`.
   */
  async revoke(id: string, reason: TokenRevokeReason): Promise<boolean> {
    const { count } = await this.prisma.db.adminRefreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });

    return count > 0;
  }

  async revokeAllForSessions(
    sessionIds: readonly string[],
    reason: TokenRevokeReason,
  ): Promise<number> {
    if (sessionIds.length === 0) {
      return 0;
    }

    const { count } = await this.prisma.db.adminRefreshToken.updateMany({
      where: { sessionId: { in: [...sessionIds] }, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });

    return count;
  }
}
