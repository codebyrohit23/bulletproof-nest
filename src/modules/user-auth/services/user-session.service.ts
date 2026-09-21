import { ConflictException, Injectable } from '@nestjs/common';
import { SessionRevokeReason, TokenRevokeReason, type UserSession } from '@prisma/client';

import { AUTH_FAILURE_REASON, UserSessionValidator } from '#/core/auth/index.js';
import type { UserSessionValidationResult } from '#/core/auth/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import {
  isUniqueConstraintViolation,
  TransactionService,
} from '#/infrastructure/database/prisma/index.js';
import type { OffsetSlice } from '#/shared/pagination/index.js';

import { UserSessionCacheService } from '../cache/user-session.cache.js';
import {
  SESSION_ACTIVITY_THROTTLE_MS,
  USER_AUTH_ERROR_MESSAGE,
  USER_AUTH_LOG_CONTEXT,
} from '../constants/index.js';
import type {
  CreateSessionInput,
  SessionPageQuery,
  SessionSummaryRow,
} from '../interfaces/index.js';
import { UserSessionRepository } from '../repositories/index.js';

import { UserRefreshTokenService } from './user-refresh-token.service.js';

@Injectable()
export class UserSessionService extends UserSessionValidator {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly sessionRepo: UserSessionRepository,
    private readonly sessionCache: UserSessionCacheService,
    private readonly refreshTokenService: UserRefreshTokenService,
    private readonly transaction: TransactionService,
  ) {
    super();
  }

  async startForDevice(input: CreateSessionInput): Promise<UserSession> {
    try {
      return await this.supersedeAndCreate(input);
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) {
        throw error;
      }

      this.logger.warn('Concurrent sign-in for one device — retrying once', {
        context: USER_AUTH_LOG_CONTEXT,
        operation: 'startForDevice',
        metadata: { userId: input.userId, deviceId: input.device.deviceId },
      });
    }

    try {
      return await this.supersedeAndCreate(input);
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) {
        throw error;
      }

      this.logger.warn('Concurrent sign-in did not settle after a retry', {
        context: USER_AUTH_LOG_CONTEXT,
        operation: 'startForDevice',
        metadata: { userId: input.userId, deviceId: input.device.deviceId },
      });

      throw new ConflictException(USER_AUTH_ERROR_MESSAGE.SIGN_IN_CONFLICT);
    }
  }

  async revoke(sessionId: string, reason: SessionRevokeReason): Promise<boolean> {
    return this.transaction.run(() => this.retire(sessionId, reason));
  }

  async listForUser(
    userId: string,
    query: SessionPageQuery,
    now: Date,
  ): Promise<OffsetSlice<SessionSummaryRow>> {
    return this.sessionRepo.findPageByUser(userId, query, now);
  }

  async revokeOwned(userId: string, sessionId: string): Promise<boolean> {
    return this.transaction.run(async () => {
      const revoked = await this.sessionRepo.revokeOwned(
        sessionId,
        userId,
        SessionRevokeReason.USER_REVOKED,
      );

      if (!revoked) {
        return false;
      }

      await this.refreshTokenService.revokeSessionTokens(
        sessionId,
        TokenRevokeReason.SESSION_REVOKED,
      );

      await this.evictAfterCommit(sessionId);

      return true;
    });
  }

  async revokeAllForUser(
    userId: string,
    reason: SessionRevokeReason,
    exceptSessionId?: string,
  ): Promise<number> {
    return this.transaction.run(async () => {
      const revokedIds = await this.sessionRepo.revokeAllForUser(userId, reason, exceptSessionId);

      if (revokedIds.length === 0) {
        return 0;
      }

      await this.refreshTokenService.revokeSessionTokens(
        revokedIds,
        TokenRevokeReason.SESSION_REVOKED,
      );

      await this.evictAfterCommit(revokedIds);

      return revokedIds.length;
    });
  }

  private async supersedeAndCreate(input: CreateSessionInput): Promise<UserSession> {
    return this.transaction.run(async () => {
      const supersededId = await this.sessionRepo.findLiveIdByDevice(
        input.userId,
        input.device.deviceId,
      );

      if (supersededId !== null) {
        await this.retire(supersededId, SessionRevokeReason.SUPERSEDED);
      }

      return this.sessionRepo.create(input);
    });
  }

  override async validate(
    sessionId: string,
    deviceId: string,
  ): Promise<UserSessionValidationResult> {
    const session = await this.sessionCache.remember(sessionId, () => {
      return this.sessionRepo.findSnapshotById(sessionId);
    });

    if (session === null) {
      return { ok: false, reason: AUTH_FAILURE_REASON.SESSION_UNKNOWN };
    }

    if (session.revokedAtMs !== null) {
      return { ok: false, reason: AUTH_FAILURE_REASON.SESSION_REVOKED };
    }

    if (session.expiresAtMs <= Date.now()) {
      return { ok: false, reason: AUTH_FAILURE_REASON.SESSION_EXPIRED };
    }

    if (session.deviceId === null) {
      return { ok: false, reason: AUTH_FAILURE_REASON.SESSION_UNBOUND };
    }

    if (session.deviceId !== deviceId) {
      return { ok: false, reason: AUTH_FAILURE_REASON.DEVICE_MISMATCH };
    }

    if (
      !session.lastActivityAtMs ||
      session.lastActivityAtMs <= Date.now() - SESSION_ACTIVITY_THROTTLE_MS
    ) {
      await this.stampActivity(sessionId);
    }

    return { ok: true, session: { id: session.id, userId: session.userId } };
  }

  private async stampActivity(sessionId: string): Promise<void> {
    try {
      await this.sessionRepo.touchActivity(sessionId);
    } catch (error) {
      this.logger.warn('Failed to record session activity', {
        context: USER_AUTH_LOG_CONTEXT,
        operation: 'stampActivity',
        metadata: { sessionId, reason: error instanceof Error ? error.message : 'unknown' },
      });
    }
  }

  private async retire(sessionId: string, reason: SessionRevokeReason): Promise<boolean> {
    const revoked = await this.sessionRepo.revoke(sessionId, reason);

    await this.refreshTokenService.revokeSessionTokens(
      sessionId,
      TokenRevokeReason.SESSION_REVOKED,
    );

    await this.evictAfterCommit(sessionId);

    return revoked;
  }

  private async evictAfterCommit(sessionId: string | readonly string[]): Promise<void> {
    await this.transaction.runAfterCommit(async () => {
      await this.sessionCache.invalidate(sessionId);
    });
  }
}
