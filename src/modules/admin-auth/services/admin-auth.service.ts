import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AdminStatus,
  AdminVerificationPurpose,
  SessionRevokeReason,
  TokenRevokeReason,
} from '@prisma/client';

import { AppConfigService } from '#/config/app/index.js';
import { AUTH_ERROR_MESSAGE, AUTH_FAILURE_REASON } from '#/core/auth/index.js';
import { EMAIL_TEMPLATE, EmailService } from '#/core/communication/email/index.js';
import { RequestContextService } from '#/core/context/index.js';
import { JWT_AUDIENCE, JwtSignerService, TOKEN_TTL_SECONDS } from '#/core/jwt/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';
import { AdminService, type AdminSnapshot } from '#/modules/admins/index.js';
import { buildOffsetPagination, paginate } from '#/shared/pagination/index.js';

import {
  ADMIN_AUTH_ERROR_MESSAGE,
  ADMIN_AUTH_LOG_CONTEXT,
  ADMIN_AUTH_RESULT_STATUS,
  ADMIN_PASSWORD_RESET_TOKEN_TTL_SECONDS,
  ADMIN_VERIFICATION_CODE_TTL_MINUTES,
} from '../constants/index.js';
import type {
  AdminAuthResult,
  AdminAuthTokens,
  AdminChangePasswordInput,
  AdminListSessionsQuery,
  AdminLoginInput,
  AdminRequestPasswordResetInput,
  AdminPasswordResetToken,
  AdminResetPasswordInput,
  AdminRevokedSessions,
  AdminSessionPage,
  AdminVerifyPasswordResetCodeInput,
} from '../dto/index.js';
import {
  ADMIN_PASSWORD_RESET_TOKEN_OUTCOME,
  ADMIN_REFRESH_TOKEN_OUTCOME,
  type AdminCodeEmailTemplate,
  type AdminPasswordChangeMethod,
  type AdminSessionRevocation,
} from '../interfaces/index.js';
import { toAdminSession, toAuthAdmin } from '../mappers/index.js';
import { resolveAdminDeviceContext } from '../utils/index.js';

import { AdminCredentialService } from './admin-credential.service.js';
import { AdminPasswordResetTokenService } from './admin-password-reset-token.service.js';
import { AdminRefreshTokenService } from './admin-refresh-token.service.js';
import { AdminSessionService } from './admin-session.service.js';
import { AdminVerificationCodeService } from './admin-verification-code.service.js';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly adminService: AdminService,
    private readonly credentialService: AdminCredentialService,
    private readonly sessionService: AdminSessionService,
    private readonly refreshTokenService: AdminRefreshTokenService,
    private readonly verificationCodeService: AdminVerificationCodeService,
    private readonly passwordResetTokenService: AdminPasswordResetTokenService,
    private readonly jwtSigner: JwtSignerService,
    private readonly requestContext: RequestContextService,
    private readonly transaction: TransactionService,
    private readonly email: EmailService,
    private readonly appConfig: AppConfigService,
  ) {}

  async login(payload: AdminLoginInput): Promise<{
    result: AdminAuthResult;
    refreshToken: string;
  }> {
    const { email, password } = payload;

    const deviceId = this.requireDeviceId('login');

    const admin = await this.adminService.findByEmail(email);

    if (admin === null) {
      throw await this.credentialService.invalidCredentialsError(password);
    }

    const credential = await this.credentialService.findByAdminId(admin.id);

    await this.credentialService.verifyPassword(
      admin.id,
      password,
      credential?.passwordHash ?? null,
    );

    this.assertCanSignIn(admin.status, admin.id);

    const device = resolveAdminDeviceContext(deviceId, this.requestContext.get());

    const session = await this.sessionService.startForDevice({ adminId: admin.id, device });

    const refreshToken = await this.refreshTokenService.issue(session.id, admin.id);

    const accessToken = await this.jwtSigner.signAccessToken(
      { sub: admin.id, sid: session.id },
      JWT_AUDIENCE.ADMIN,
    );

    this.requestContext.setIdentity({ adminId: admin.id, sessionId: session.id });

    return {
      result: {
        status: ADMIN_AUTH_RESULT_STATUS.AUTHENTICATED,
        admin: toAuthAdmin(admin),
        tokens: { accessToken, expiresIn: TOKEN_TTL_SECONDS.ACCESS },
      },
      refreshToken: refreshToken.token,
    };
  }

  /** Rotates on use: the presented token is spent and a replacement returned for the cookie. */
  async refreshSession(token: string | undefined): Promise<{
    tokens: AdminAuthTokens;
    refreshToken: string;
  }> {
    const deviceId = this.requireDeviceId('refresh-session');

    if (token === undefined) {
      this.refuseRefresh();
    }

    const verification = await this.refreshTokenService.verify(token);

    if (verification.outcome === ADMIN_REFRESH_TOKEN_OUTCOME.UNKNOWN) {
      this.refuseRefresh();
    }

    const { sessionId } = verification.token;

    if (verification.outcome === ADMIN_REFRESH_TOKEN_OUTCOME.REUSED) {
      await this.revokeReusedSession(sessionId);

      this.refuseRefresh();
    }

    if (verification.outcome === ADMIN_REFRESH_TOKEN_OUTCOME.EXPIRED) {
      this.refuseRefresh();
    }

    const validation = await this.sessionService.validate(sessionId, deviceId);

    if (!validation.ok) {
      this.refuseRefresh();
    }

    const rotated = await this.refreshTokenService.rotate(verification.token);

    if (rotated === null) {
      this.refuseRefresh();
    }

    const { session } = validation;

    const accessToken = await this.jwtSigner.signAccessToken(
      { sub: session.adminId, sid: session.id },
      JWT_AUDIENCE.ADMIN,
    );

    this.requestContext.setIdentity({ adminId: session.adminId, sessionId: session.id });

    return {
      tokens: { accessToken, expiresIn: TOKEN_TTL_SECONDS.ACCESS },
      refreshToken: rotated.token,
    };
  }

  async requestPasswordReset(payload: AdminRequestPasswordResetInput): Promise<null> {
    const admin = await this.adminService.findByEmail(payload.email);

    if (admin === null || admin.status !== AdminStatus.ACTIVE) {
      return null;
    }

    await this.issueAndDeliver(
      EMAIL_TEMPLATE.ADMIN_AUTH.PASSWORD_RESET_CODE,
      AdminVerificationPurpose.PASSWORD_RESET,
      admin,
      'request-password-reset',
    );

    return null;
  }

  async verifyPasswordResetCode(
    payload: AdminVerifyPasswordResetCodeInput,
  ): Promise<AdminPasswordResetToken> {
    const { email, code } = payload;

    const admin = await this.adminService.findByEmail(email);

    if (admin === null || admin.status !== AdminStatus.ACTIVE) {
      throw new BadRequestException(ADMIN_AUTH_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }

    const codeId = await this.verificationCodeService.verify(
      admin.id,
      AdminVerificationPurpose.PASSWORD_RESET,
      code,
    );

    const issued = await this.transaction.run(async () => {
      await this.verificationCodeService.consume(codeId);

      if (admin.emailVerifiedAt === null) {
        await this.adminService.markEmailVerified(admin.id);
      }

      return this.passwordResetTokenService.issue(admin.id);
    });

    return { resetToken: issued.token, expiresIn: ADMIN_PASSWORD_RESET_TOKEN_TTL_SECONDS };
  }

  async resetPassword(payload: AdminResetPasswordInput): Promise<null> {
    const { token, password } = payload;

    const verification = await this.passwordResetTokenService.verify(token);

    if (verification.outcome !== ADMIN_PASSWORD_RESET_TOKEN_OUTCOME.VALID) {
      this.logger.warn('Refused an admin password reset token', {
        context: ADMIN_AUTH_LOG_CONTEXT,
        operation: 'reset-password',
        metadata: {
          outcome: verification.outcome,
          ...('token' in verification ? { adminId: verification.token.adminId } : {}),
        },
      });

      this.refusePasswordReset();
    }

    const { id, adminId } = verification.token;

    const admin = await this.adminService.getAdminById(adminId);

    if (admin === null || admin.status !== AdminStatus.ACTIVE) {
      this.logger.warn('Refused a password reset to an admin that is not active', {
        context: ADMIN_AUTH_LOG_CONTEXT,
        operation: 'reset-password',
        metadata: { adminId, status: admin?.status ?? 'removed' },
      });

      this.refusePasswordReset();
    }

    await this.transaction.run(async () => {
      const spent = await this.passwordResetTokenService.consume(id);

      if (!spent) {
        this.refusePasswordReset();
      }

      const credential = await this.credentialService.setCredential(admin.id, password);

      await this.sessionService.revokeAllForAdmin(admin.id, SessionRevokeReason.PASSWORD_RESET);

      await this.notifyPasswordChanged(
        admin,
        'reset',
        credential.passwordChangedAt,
        `admin-password-reset-done-${id}`,
      );
    });

    return null;
  }

  /** Every **other** session is revoked; the one that made the change stays signed in. */
  async changePassword(
    adminId: string,
    sessionId: string,
    payload: AdminChangePasswordInput,
  ): Promise<null> {
    const { currentPassword, newPassword } = payload;

    const credential = await this.credentialService.findByAdminId(adminId);

    await this.credentialService.verifyCurrentPassword(
      adminId,
      currentPassword,
      credential?.passwordHash ?? null,
    );

    const admin = await this.adminService.getAdminById(adminId);

    if (admin === null) {
      throw new UnauthorizedException(AUTH_ERROR_MESSAGE.UNAUTHORIZED);
    }

    await this.transaction.run(async () => {
      const updated = await this.credentialService.setCredential(adminId, newPassword);

      await this.sessionService.revokeAllForAdmin(
        adminId,
        SessionRevokeReason.PASSWORD_CHANGED,
        sessionId,
      );

      await this.notifyPasswordChanged(
        admin,
        'changed',
        updated.passwordChangedAt,
        `admin-password-changed-${adminId}-${updated.passwordChangedAt.getTime()}`,
      );
    });

    return null;
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionService.revoke(sessionId, SessionRevokeReason.LOGOUT);
  }

  async listSessions(
    adminId: string,
    currentSessionId: string,
    query: AdminListSessionsQuery,
  ): Promise<AdminSessionPage> {
    const now = new Date();

    const { rows, total } = await this.sessionService.listForAdmin(adminId, query, now);

    return paginate(
      rows.map((row) => toAdminSession(row, currentSessionId, now)),
      buildOffsetPagination(total, query.page, query.limit),
    );
  }

  /**
   * 404 for a session that is not the caller's, never 403: a 403 would confirm
   * that the id belongs to another admin.
   */
  async revokeSession(
    adminId: string,
    currentSessionId: string,
    sessionId: string,
  ): Promise<AdminSessionRevocation> {
    const revoked = await this.sessionService.revokeOwned(adminId, sessionId);

    if (!revoked) {
      throw new NotFoundException(ADMIN_AUTH_ERROR_MESSAGE.SESSION_NOT_FOUND);
    }

    return { wasCurrent: sessionId === currentSessionId };
  }

  async revokeOtherSessions(
    adminId: string,
    currentSessionId: string,
  ): Promise<AdminRevokedSessions> {
    const revoked = await this.sessionService.revokeAllForAdmin(
      adminId,
      SessionRevokeReason.USER_REVOKED,
      currentSessionId,
    );

    return { revoked };
  }

  private issueAndDeliver(
    template: AdminCodeEmailTemplate,
    purpose: AdminVerificationPurpose,
    admin: AdminSnapshot,
    operation: string,
  ): Promise<void> {
    return this.transaction.run(async () => {
      const issued = await this.verificationCodeService.issueIfDue(admin.id, purpose);

      if (issued === null) {
        this.logger.debug('A live code is still fresh — none issued', {
          context: ADMIN_AUTH_LOG_CONTEXT,
          operation,
          metadata: { adminId: admin.id, purpose },
        });

        return;
      }

      await this.email.send(template, {
        to: admin.email,
        data: { code: issued.code, expiresInMinutes: ADMIN_VERIFICATION_CODE_TTL_MINUTES },
        idempotencyKey: `admin-verification-${issued.id}`,
        recipientRef: { adminId: admin.id },
        expiresAt: issued.expiresAt,
      });
    });
  }

  private async notifyPasswordChanged(
    admin: AdminSnapshot,
    method: AdminPasswordChangeMethod,
    changedAt: Date,
    idempotencyKey: string,
  ): Promise<void> {
    await this.email.send(EMAIL_TEMPLATE.ADMIN_AUTH.PASSWORD_CHANGED, {
      to: admin.email,
      data: {
        firstName: admin.firstName,
        method,
        changedAt: changedAt.toISOString(),
        signInUrl: this.appConfig.adminWebAppUrl,
      },
      idempotencyKey,
      recipientRef: { adminId: admin.id },
    });
  }

  private refusePasswordReset(): never {
    throw new UnauthorizedException(ADMIN_AUTH_ERROR_MESSAGE.INVALID_OR_EXPIRED_RESET_TOKEN);
  }

  private refuseRefresh(): never {
    throw new UnauthorizedException(ADMIN_AUTH_ERROR_MESSAGE.INVALID_REFRESH_TOKEN);
  }

  /**
   * A spent token presented again means two parties hold it — the session is
   * ended outright, because there is no telling which of them is the admin.
   */
  private async revokeReusedSession(sessionId: string): Promise<void> {
    this.logger.warn('Admin refresh token reused — ending the session', {
      context: ADMIN_AUTH_LOG_CONTEXT,
      operation: 'refresh-session',
      metadata: { sessionId, reason: AUTH_FAILURE_REASON.REFRESH_TOKEN_REUSED },
    });

    await this.transaction.run(async () => {
      await this.refreshTokenService.revokeSessionTokens(
        sessionId,
        TokenRevokeReason.REUSE_DETECTED,
      );

      await this.sessionService.revoke(sessionId, SessionRevokeReason.TOKEN_REUSE_DETECTED);
    });
  }

  private assertCanSignIn(status: AdminStatus, adminId: string): void {
    if (status === AdminStatus.ACTIVE) {
      return;
    }

    this.logger.warn('Refused a session to an admin that is not active', {
      context: ADMIN_AUTH_LOG_CONTEXT,
      operation: 'login',
      metadata: {
        adminId,
        status,
        reason:
          status === AdminStatus.SUSPENDED
            ? AUTH_FAILURE_REASON.ACCOUNT_SUSPENDED
            : AUTH_FAILURE_REASON.ACCOUNT_DEACTIVATED,
      },
    });

    throw new UnauthorizedException(ADMIN_AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS);
  }

  private requireDeviceId(operation: string): string {
    const deviceId = this.requestContext.deviceId;

    if (deviceId === undefined) {
      this.logger.warn('Rejected an admin sign-in with no usable device id', {
        context: ADMIN_AUTH_LOG_CONTEXT,
        operation,
        metadata: { reason: AUTH_FAILURE_REASON.DEVICE_ID_MISSING },
      });

      throw new UnauthorizedException(ADMIN_AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS);
    }

    return deviceId;
  }
}
