import { Injectable } from '@nestjs/common';
import type { TokenRevokeReason, UserRefreshToken } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

import { REFRESH_TOKEN_TTL_MS } from '../constants/index.js';
import type { CreateRefreshTokenInput, RefreshTokenWithSession } from '../interfaces/index.js';

@Injectable()
export class UserRefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateRefreshTokenInput): Promise<UserRefreshToken> {
    return this.prisma.db.userRefreshToken.create({
      data: {
        userId: input.userId,
        sessionId: input.sessionId,
        tokenHash: input.tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
  }

  /**
   * Looks a token up by hash, never by id.
   *
   * The hash is unique, so this is a single point read — and it is the only
   * way in, because the id is a value the client has never seen.
   */
  async findByTokenHash(tokenHash: string): Promise<RefreshTokenWithSession | null> {
    return this.prisma.db.userRefreshToken.findUnique({
      where: { tokenHash },
      include: { session: true },
    });
  }

  /**
   * Retires one token, reporting whether this call is the one that did it.
   *
   * Guarded on `revokedAt: null` rather than blind, which is what makes
   * rotation safe under concurrency: two tabs refreshing with the same token
   * both read a live row, both try to revoke it, and exactly one gets `true`.
   * The loser must not go on to mint a second token — the `false` is how it
   * finds out, and a blind `update` would hide it by succeeding twice.
   */
  async revoke(id: string, reason: TokenRevokeReason): Promise<boolean> {
    const { count } = await this.prisma.db.userRefreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });

    return count > 0;
  }

  /**
   * Retires every live token on one or more sessions. Used by logout, by reuse
   * detection, by a fresh login superseding a device's previous session, and by
   * "sign out everywhere".
   *
   * Takes a list rather than a single id so that revoking a user's twelve
   * sessions is one statement instead of twelve. The single-session callers
   * pass a one-element array, which costs them nothing and spares this file a
   * second near-identical method.
   *
   * Scoped to live rows so an already-revoked token keeps the reason that
   * retired it — overwriting a `REUSE_DETECTED` with a later `LOGOUT` would
   * erase the only record of why the session really ended.
   */
  async revokeAllForSessions(
    sessionIds: readonly string[],
    reason: TokenRevokeReason,
  ): Promise<number> {
    if (sessionIds.length === 0) {
      return 0;
    }

    const { count } = await this.prisma.db.userRefreshToken.updateMany({
      where: { sessionId: { in: [...sessionIds] }, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });

    return count;
  }

  /**
   * The reaper, and the only consumer of the `expiresAt` index.
   *
   * Deletes rather than retires: past expiry a token cannot authenticate
   * anything, so the row's only remaining value is forensic, and `cutoff` is
   * how a caller keeps as much of that history as it wants.
   */
  async deleteExpiredBefore(cutoff: Date): Promise<number> {
    const { count } = await this.prisma.db.userRefreshToken.deleteMany({
      where: { expiresAt: { lt: cutoff } },
    });

    return count;
  }
}
