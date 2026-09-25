import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AdminStatus, SessionRevokeReason, VerificationPurpose } from '@prisma/client';

import { AppConfigService } from '#/config/app/index.js';
import { AUTH_FAILURE_REASON } from '#/core/auth/index.js';
import { EMAIL_TEMPLATE, EmailService } from '#/core/communication/email/index.js';
import { RequestContextService } from '#/core/context/index.js';
import { JWT_AUDIENCE, JwtSignerService, TOKEN_TTL_SECONDS } from '#/core/jwt/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';
import { AdminService, type AdminSnapshot } from '#/modules/admins/index.js';

import {
  ADMIN_AUTH_ERROR_MESSAGE,
  ADMIN_AUTH_LOG_CONTEXT,
  ADMIN_AUTH_RESULT_STATUS,
  ADMIN_PASSWORD_RESET_TOKEN_TTL_SECONDS,
  ADMIN_VERIFICATION_CODE_TTL_MINUTES,
} from '../constants/index.js';
import type {
  AdminAuthResult,
  AdminLoginInput,
  AdminRequestPasswordResetInput,
  AdminPasswordResetToken,
  AdminResetPasswordInput,
  AdminVerifyPasswordResetCodeInput,
} from '../dto/index.js';
import {
  ADMIN_PASSWORD_RESET_TOKEN_OUTCOME,
  type AdminCodeEmailTemplate,
  type AdminCodePurpose,
  type AdminPasswordChangeMethod,
} from '../interfaces/index.js';
import { toAuthAdmin } from '../mappers/index.js';
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

  async requestPasswordReset(payload: AdminRequestPasswordResetInput): Promise<null> {
    const admin = await this.adminService.findByEmail(payload.email);

    if (admin === null || admin.status !== AdminStatus.ACTIVE) {
      return null;
    }

    await this.issueAndDeliver(
      EMAIL_TEMPLATE.ADMIN_AUTH.PASSWORD_RESET_CODE,
      VerificationPurpose.PASSWORD_RESET,
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
      VerificationPurpose.PASSWORD_RESET,
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

  private issueAndDeliver(
    template: AdminCodeEmailTemplate,
    purpose: AdminCodePurpose,
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
