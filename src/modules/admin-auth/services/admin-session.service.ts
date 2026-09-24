import { ConflictException, Injectable } from '@nestjs/common';
import { SessionRevokeReason, TokenRevokeReason, type AdminSession } from '@prisma/client';

import { AUTH_FAILURE_REASON, AdminSessionValidator } from '#/core/auth/index.js';
import type { AdminSessionValidationResult } from '#/core/auth/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import {
  isUniqueConstraintViolation,
  TransactionService,
} from '#/infrastructure/database/prisma/index.js';

import { AdminSessionCacheService } from '../cache/admin-session.cache.js';
import {
  ADMIN_AUTH_ERROR_MESSAGE,
  ADMIN_AUTH_LOG_CONTEXT,
  ADMIN_SESSION_ACTIVITY_THROTTLE_MS,
} from '../constants/index.js';
import type { CreateAdminSessionInput } from '../interfaces/index.js';
import { AdminSessionRepository } from '../repositories/index.js';

import { AdminRefreshTokenService } from './admin-refresh-token.service.js';

@Injectable()
export class AdminSessionService extends AdminSessionValidator {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly sessionRepo: AdminSessionRepository,
    private readonly sessionCache: AdminSessionCacheService,
    private readonly refreshTokenService: AdminRefreshTokenService,
    private readonly transaction: TransactionService,
  ) {
    super();
  }

  async startForDevice(input: CreateAdminSessionInput): Promise<AdminSession> {
    try {
      return await this.supersedeAndCreate(input);
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) {
        throw error;
      }

      this.logger.warn('Concurrent admin sign-in for one device — retrying once', {
        context: ADMIN_AUTH_LOG_CONTEXT,
        operation: 'startForDevice',
        metadata: { adminId: input.adminId, deviceId: input.device.deviceId },
      });
    }

    try {
      return await this.supersedeAndCreate(input);
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) {
        throw error;
      }

      this.logger.warn('Concurrent admin sign-in did not settle after a retry', {
        context: ADMIN_AUTH_LOG_CONTEXT,
        operation: 'startForDevice',
        metadata: { adminId: input.adminId, deviceId: input.device.deviceId },
      });

      throw new ConflictException(ADMIN_AUTH_ERROR_MESSAGE.SIGN_IN_CONFLICT);
    }
  }

  override async validate(
    sessionId: string,
    deviceId: string,
  ): Promise<AdminSessionValidationResult> {
    const session = await this.sessionCache.remember(sessionId, () =>
      this.sessionRepo.findSnapshotById(sessionId),
    );

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
      session.lastActivityAtMs === null ||
      session.lastActivityAtMs <= Date.now() - ADMIN_SESSION_ACTIVITY_THROTTLE_MS
    ) {
      await this.stampActivity(sessionId);
    }

    return { ok: true, session: { id: session.id, adminId: session.adminId } };
  }

  /**
   * Every live session but `exceptSessionId`, its refresh tokens, and — only
   * once the transaction commits — its cache entry. Evicting earlier would let
   * a concurrent request re-cache the session as live from a read that has not
   * yet seen the revoke.
   */
  async revokeAllForAdmin(
    adminId: string,
    reason: SessionRevokeReason,
    exceptSessionId?: string,
  ): Promise<number> {
    return this.transaction.run(async () => {
      const revokedIds = await this.sessionRepo.revokeAllForAdmin(adminId, reason, exceptSessionId);

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

  private async supersedeAndCreate(input: CreateAdminSessionInput): Promise<AdminSession> {
    return this.transaction.run(async () => {
      const supersededId = await this.sessionRepo.findLiveIdByDevice(
        input.adminId,
        input.device.deviceId,
      );

      if (supersededId !== null) {
        await this.retire(supersededId, SessionRevokeReason.SUPERSEDED);
      }

      return this.sessionRepo.create(input);
    });
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

  /** Recording activity must never fail a request that is otherwise fine. */
  private async stampActivity(sessionId: string): Promise<void> {
    try {
      await this.sessionRepo.touchActivity(sessionId);
    } catch (error) {
      this.logger.warn('Failed to record admin session activity', {
        context: ADMIN_AUTH_LOG_CONTEXT,
        operation: 'stampActivity',
        metadata: { sessionId, reason: error instanceof Error ? error.message : 'unknown' },
      });
    }
  }

  private async evictAfterCommit(sessionId: string | readonly string[]): Promise<void> {
    await this.transaction.runAfterCommit(async () => {
      await this.sessionCache.invalidate(sessionId);
    });
  }
}
