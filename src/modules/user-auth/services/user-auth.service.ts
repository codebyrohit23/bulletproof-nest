import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  type DevicePlatform,
  IdentifierType,
  SessionRevokeReason,
  TokenRevokeReason,
  UserStatus,
  VerificationPurpose,
} from '@prisma/client';

import { AppConfigService } from '#/config/app/index.js';
import {
  AUTH_ERROR_MESSAGE,
  AUTH_FAILURE_REASON,
  type AuthFailureReason,
} from '#/core/auth/index.js';
import { EMAIL_TEMPLATE, EmailService } from '#/core/communication/email/index.js';
import { RequestContextService } from '#/core/context/index.js';
import { JwtSignerService, TOKEN_TTL_SECONDS } from '#/core/jwt/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';
import { UserService } from '#/modules/users/index.js';
import {
  VERIFICATION_CODE_TTL_MINUTES,
  VERIFICATION_ERROR_MESSAGE,
  VerificationCodeService,
  verificationPurposeFor,
  type IssuedVerificationCode,
} from '#/modules/verification/index.js';
import type { IdentifierInput } from '#/shared/schemas/index.js';

import {
  AUTH_RESULT_STATUS,
  PASSWORD_RESET_TOKEN_TTL_SECONDS,
  USER_AUTH_ERROR_MESSAGE,
  USER_AUTH_LOG_CONTEXT,
} from '../constants/index.js';
import type {
  AuthResult,
  AuthTokens,
  ChangePasswordInput,
  LoginInput,
  OtpLoginInput,
  OtpLoginRequestInput,
  PasswordResetToken,
  RegisterInput,
  RegisterResponse,
  ResendVerificationInput,
  ResetPasswordInput,
  ResetPasswordRequestInput,
  RevokedSessions,
  UserSessionList,
  VerifyCodeInput,
  VerifyResetOtpInput,
} from '../dto/index.js';
import {
  PASSWORD_RESET_TOKEN_OUTCOME,
  REFRESH_TOKEN_OUTCOME,
  type CodeEmailTemplate,
  type DeclaredDevice,
  type PasswordChangeMethod,
  type PasswordResetTokenOutcome,
  type SessionRevocation,
} from '../interfaces/index.js';
import type { AuthUser } from '../schemas/index.js';
import { resolveDeviceContext, toUserSession } from '../utils/index.js';

import { UserCredentialService } from './user-credential.service.js';
import { UserIdentityService } from './user-identity.service.js';
import { UserPasswordResetTokenService } from './user-password-reset-token.service.js';
import { UserRefreshTokenService } from './user-refresh-token.service.js';
import { UserSessionService } from './user-session.service.js';

@Injectable()
export class UserAuthService {
  constructor(
    private readonly logger: AppLoggerService,
    private readonly userService: UserService,
    private readonly userIdentityService: UserIdentityService,
    private readonly userCredentialService: UserCredentialService,
    private readonly verificationCodeService: VerificationCodeService,
    private readonly transaction: TransactionService,
    private readonly userSessionService: UserSessionService,
    private readonly refreshTokenService: UserRefreshTokenService,
    private readonly passwordResetTokenService: UserPasswordResetTokenService,
    private readonly jwtSigner: JwtSignerService,
    private readonly requestContext: RequestContextService,
    private readonly email: EmailService,
    private readonly appConfig: AppConfigService,
  ) {}
  async registerUser(payload: RegisterInput): Promise<RegisterResponse> {
    const { identifier } = payload;

    const existing = await this.userIdentityService.findIdentityWithUser(
      identifier.type,
      identifier.value,
    );

    if (existing !== null) {
      throw new ConflictException(this.resolveConflictMessage(identifier.type));
    }

    return this.transaction.run<RegisterResponse>(async () => {
      const userId = await this.createAccount(payload);

      await this.issueAndDeliver(
        EMAIL_TEMPLATE.OTP_VERIFICATION,
        identifier,
        verificationPurposeFor(identifier.type),
        userId,
        'register-user',
      );

      return { userId, identifier, verificationRequired: true };
    });
  }

  async verifyRegistration(payload: VerifyCodeInput): Promise<AuthResult> {
    const { identifier, code, platform, device } = payload;

    const deviceId = this.requireDeviceId('verify-registration');

    const target = await this.userIdentityService.findIdentityWithUser(
      identifier.type,
      identifier.value,
    );

    if (target === null) {
      throw new BadRequestException(VERIFICATION_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }

    const codeId = await this.verificationCodeService.verify(
      identifier,
      verificationPurposeFor(identifier.type),
      code,
    );

    await this.transaction.run(async () => {
      await this.verificationCodeService.consume(codeId);

      await this.userIdentityService.markVerified(target.id);

      await this.sendWelcome(target.userId, identifier);
    });

    this.assertAccountCanSignIn(target.user.status, target.userId, 'verify-registration');

    return this.createSessionAndIssueTokens(target.userId, deviceId, platform, device);
  }

  async resendVerification(payload: ResendVerificationInput): Promise<null> {
    const { identifier } = payload;
    const purpose = verificationPurposeFor(identifier.type);

    const existing = await this.userIdentityService.findIdentityWithUser(
      identifier.type,
      identifier.value,
    );

    const shouldSend = existing !== null && existing.verifiedAt === null;

    if (!shouldSend) {
      return null;
    }

    await this.issueAndDeliver(
      EMAIL_TEMPLATE.OTP_VERIFICATION,
      identifier,
      purpose,
      existing.userId,
      'resend-verification',
    );

    return null;
  }

  async login(payload: LoginInput): Promise<AuthResult> {
    const { email, password, platform, device } = payload;

    const deviceId = this.requireDeviceId('login');

    const existing = await this.userIdentityService.findIdentityWithUserAndCredential(
      IdentifierType.EMAIL,
      email,
    );

    if (!existing || !existing.user.credential) {
      throw await this.userCredentialService.invalidCredentialsError(password);
    }

    await this.userCredentialService.verifyPassword(
      existing.user.id,
      password,
      existing.user.credential.passwordHash,
    );

    this.assertAccountCanSignIn(existing.user.status, existing.userId, 'login');

    if (existing.verifiedAt === null) {
      return this.challengeForVerification(existing.userId, {
        type: IdentifierType.EMAIL,
        value: existing.identifierValue,
      });
    }

    return this.createSessionAndIssueTokens(existing.userId, deviceId, platform, device);
  }

  async requestLoginOtp(payload: OtpLoginRequestInput): Promise<null> {
    const { identifier } = payload;

    const existing = await this.userIdentityService.findIdentityWithUser(
      identifier.type,
      identifier.value,
    );

    if (!existing) {
      return null;
    }

    await this.issueAndDeliver(
      EMAIL_TEMPLATE.LOGIN_OTP,
      identifier,
      VerificationPurpose.LOGIN,
      existing.userId,
      'request-login-otp',
    );

    return null;
  }

  async loginWithOtp(payload: OtpLoginInput): Promise<AuthResult> {
    const { identifier, code, platform, device } = payload;

    const deviceId = this.requireDeviceId('login-with-otp');

    const target = await this.userIdentityService.findIdentityWithUser(
      identifier.type,
      identifier.value,
    );

    if (target === null) {
      throw new BadRequestException(VERIFICATION_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }

    const codeId = await this.verificationCodeService.verify(
      identifier,
      VerificationPurpose.LOGIN,
      code,
    );

    await this.transaction.run(async () => {
      await this.verificationCodeService.consume(codeId);
      if (!target.verifiedAt) {
        await this.userIdentityService.markVerified(target.id);
      }
    });

    this.assertAccountCanSignIn(target.user.status, target.userId, 'login-with-otp');

    return this.createSessionAndIssueTokens(target.userId, deviceId, platform, device);
  }

  async refreshSession(token?: string): Promise<AuthTokens> {
    const deviceId = this.requireDeviceId('refresh-session');

    if (token === undefined) {
      this.refuseRefresh(AUTH_FAILURE_REASON.REFRESH_TOKEN_MISSING);
    }

    const verification = await this.refreshTokenService.verify(token);

    if (verification.outcome === REFRESH_TOKEN_OUTCOME.UNKNOWN) {
      this.refuseRefresh(AUTH_FAILURE_REASON.REFRESH_TOKEN_UNKNOWN);
    }

    const { sessionId } = verification.token;

    if (verification.outcome === REFRESH_TOKEN_OUTCOME.REUSED) {
      await this.revokeReusedSession(sessionId);

      this.refuseRefresh(AUTH_FAILURE_REASON.REFRESH_TOKEN_REUSED, sessionId);
    }

    if (verification.outcome === REFRESH_TOKEN_OUTCOME.EXPIRED) {
      this.refuseRefresh(AUTH_FAILURE_REASON.REFRESH_TOKEN_EXPIRED, sessionId);
    }

    const validation = await this.userSessionService.validate(sessionId, deviceId);

    if (!validation.ok) {
      this.refuseRefresh(validation.reason, sessionId);
    }

    const rotated = await this.refreshTokenService.rotate(verification.token);

    if (rotated === null) {
      this.refuseRefresh(AUTH_FAILURE_REASON.REFRESH_ROTATION_LOST, sessionId);
    }

    const { session } = validation;

    const accessToken = await this.jwtSigner.signAccessToken({
      sub: session.userId,
      sid: session.id,
    });

    this.requestContext.setIdentity({ userId: session.userId, sessionId: session.id });

    return {
      accessToken,
      refreshToken: rotated.token,
      expiresIn: TOKEN_TTL_SECONDS.ACCESS,
    };
  }

  async resetPasswordRequest(payload: ResetPasswordRequestInput): Promise<null> {
    const { email } = payload;

    const existing = await this.userIdentityService.findIdentityWithUser(
      IdentifierType.EMAIL,
      email,
    );

    if (!existing || existing.user.status !== UserStatus.ACTIVE) {
      return null;
    }

    const identifier = { type: IdentifierType.EMAIL, value: email };

    await this.issueAndDeliver(
      EMAIL_TEMPLATE.PASSWORD_RESET,
      identifier,
      VerificationPurpose.PASSWORD_RESET,
      existing.userId,
      'request-password-reset-otp',
    );

    return null;
  }

  async verifyResetOtp(payload: VerifyResetOtpInput): Promise<PasswordResetToken> {
    const { email, code } = payload;

    const target = await this.userIdentityService.findIdentityWithUser(IdentifierType.EMAIL, email);

    if (target === null || target.user.status !== UserStatus.ACTIVE) {
      throw new BadRequestException(VERIFICATION_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }

    const codeId = await this.verificationCodeService.verify(
      { type: IdentifierType.EMAIL, value: email },
      VerificationPurpose.PASSWORD_RESET,
      code,
    );

    const issued = await this.transaction.run(async () => {
      await this.verificationCodeService.consume(codeId);

      if (!target.verifiedAt) {
        await this.userIdentityService.markVerified(target.id);
      }

      return this.passwordResetTokenService.issue(target.userId);
    });

    return { resetToken: issued.token, expiresIn: PASSWORD_RESET_TOKEN_TTL_SECONDS };
  }

  async resetPassword(payload: ResetPasswordInput): Promise<null> {
    const { token, password } = payload;

    const verification = await this.passwordResetTokenService.verify(token);

    if (verification.outcome !== PASSWORD_RESET_TOKEN_OUTCOME.VALID) {
      this.refusePasswordReset(verification.outcome);
    }

    const { id, userId, user } = verification.token;

    this.assertAccountCanSignIn(user.status, userId, 'reset-password');

    await this.transaction.run(async () => {
      const spent = await this.passwordResetTokenService.consume(id);

      if (!spent) {
        this.refusePasswordReset(PASSWORD_RESET_TOKEN_OUTCOME.CONSUMED, userId);
      }

      const credential = await this.userCredentialService.setCredential(userId, password);

      await this.userSessionService.revokeAllForUser(userId, SessionRevokeReason.PASSWORD_RESET);

      await this.notifyPasswordChanged(
        userId,
        'reset',
        credential.passwordChangedAt,
        `password-reset-done-${id}`,
      );
    });

    return null;
  }

  async changePassword(payload: ChangePasswordInput): Promise<null> {
    const userId = this.requireUserId('change-password');
    const sessionId = this.requireSessionId('change-password');

    const credential = await this.userCredentialService.findCredentialByUserId(userId);

    if (!credential) {
      throw new BadRequestException(USER_AUTH_ERROR_MESSAGE.INVALID_CURRENT_PASSWORD);
    }

    const { currentPassword, newPassword } = payload;

    await this.userCredentialService.verifyPassword(
      userId,
      currentPassword,
      credential.passwordHash,
      USER_AUTH_ERROR_MESSAGE.INVALID_CURRENT_PASSWORD,
    );

    await this.transaction.run(async () => {
      const credential = await this.userCredentialService.setCredential(userId, newPassword);

      await this.userSessionService.revokeAllForUser(
        userId,
        SessionRevokeReason.PASSWORD_CHANGED,
        sessionId,
      );

      await this.notifyPasswordChanged(
        userId,
        'changed',
        credential.passwordChangedAt,
        `password-changed-${userId}-${credential.passwordChangedAt.getTime()}`,
      );
    });

    return null;
  }

  async listSessions(): Promise<UserSessionList> {
    const userId = this.requireUserId('list-sessions');
    const currentSessionId = this.requireSessionId('list-sessions');

    const rows = await this.userSessionService.listLive(userId);

    return { sessions: rows.map((row) => toUserSession(row, currentSessionId)) };
  }

  /**
   * 404 for a session that is not the caller's, never 403: a 403 would confirm
   * that the id belongs to someone.
   */
  async revokeSession(sessionId: string): Promise<SessionRevocation> {
    const userId = this.requireUserId('revoke-session');
    const currentSessionId = this.requireSessionId('revoke-session');

    const revoked = await this.userSessionService.revokeOwned(userId, sessionId);

    if (!revoked) {
      throw new NotFoundException(USER_AUTH_ERROR_MESSAGE.SESSION_NOT_FOUND);
    }

    return { wasCurrent: sessionId === currentSessionId };
  }

  async revokeOtherSessions(): Promise<RevokedSessions> {
    const userId = this.requireUserId('revoke-other-sessions');
    const currentSessionId = this.requireSessionId('revoke-other-sessions');

    const revoked = await this.userSessionService.revokeAllForUser(
      userId,
      SessionRevokeReason.USER_REVOKED,
      currentSessionId,
    );

    return { revoked };
  }

  async logout(): Promise<void> {
    const sessionId = this.requireSessionId('logout');

    await this.userSessionService.revoke(sessionId, SessionRevokeReason.LOGOUT);
  }

  private refusePasswordReset(outcome: PasswordResetTokenOutcome, userId?: string): never {
    this.logger.warn('Refused a password reset', {
      context: USER_AUTH_LOG_CONTEXT,
      operation: 'reset-password',
      metadata: { outcome, ...(userId !== undefined ? { userId } : {}) },
    });

    throw new UnauthorizedException(USER_AUTH_ERROR_MESSAGE.INVALID_OR_EXPIRED_RESET_TOKEN);
  }

  private refuseRefresh(reason: AuthFailureReason, sessionId?: string): never {
    this.logger.warn('Refused a refresh', {
      context: USER_AUTH_LOG_CONTEXT,
      operation: 'refresh-session',
      metadata: { reason, ...(sessionId !== undefined ? { sessionId } : {}) },
    });

    throw new UnauthorizedException(USER_AUTH_ERROR_MESSAGE.INVALID_REFRESH_TOKEN);
  }

  private async revokeReusedSession(sessionId: string): Promise<void> {
    await this.transaction.run(async () => {
      await this.refreshTokenService.revokeSessionTokens(
        sessionId,
        TokenRevokeReason.REUSE_DETECTED,
      );

      await this.userSessionService.revoke(sessionId, SessionRevokeReason.TOKEN_REUSE_DETECTED);
    });
  }

  private async createAccount(payload: RegisterInput): Promise<string> {
    const { identifier, firstName, lastName, password } = payload;

    const user = await this.userService.createUser({
      firstName,
      lastName,
      displayName: this.buildDisplayName(firstName, lastName),
    });

    await this.userIdentityService.createIdentity({
      userId: user.id,
      identifierType: identifier.type,
      identifierValue: identifier.value,
    });

    if (password !== undefined) {
      await this.userCredentialService.createCredential(user.id, password);
    }

    return user.id;
  }

  private requireUserId(operation: string): string {
    const userId = this.requestContext.userId;

    if (userId === undefined) {
      this.refuseUnidentified(operation);
    }

    return userId;
  }

  private requireSessionId(operation: string): string {
    const sessionId = this.requestContext.sessionId;

    if (sessionId === undefined) {
      this.refuseUnidentified(operation);
    }

    return sessionId;
  }

  private refuseUnidentified(operation: string): never {
    this.logger.warn('Handled a request that reached a guarded route with no identity', {
      context: USER_AUTH_LOG_CONTEXT,
      operation,
      metadata: { reason: AUTH_FAILURE_REASON.IDENTITY_MISSING },
    });

    throw new UnauthorizedException(AUTH_ERROR_MESSAGE.UNAUTHORIZED);
  }

  private requireDeviceId(operation: string): string {
    const deviceId = this.requestContext.deviceId;

    if (deviceId === undefined) {
      this.logger.warn('Rejected a sign-in with no usable device id', {
        context: USER_AUTH_LOG_CONTEXT,
        operation,
        metadata: { reason: AUTH_FAILURE_REASON.DEVICE_ID_MISSING },
      });

      throw new UnauthorizedException(AUTH_ERROR_MESSAGE.UNAUTHORIZED);
    }

    return deviceId;
  }

  private assertAccountCanSignIn(status: UserStatus, userId: string, operation: string): void {
    if (status === UserStatus.ACTIVE) {
      return;
    }

    const suspended = status === UserStatus.SUSPENDED;

    this.logger.warn('Refused a session to an account that is not active', {
      context: USER_AUTH_LOG_CONTEXT,
      operation,
      metadata: {
        userId,
        status,
        reason: suspended
          ? AUTH_FAILURE_REASON.ACCOUNT_SUSPENDED
          : AUTH_FAILURE_REASON.ACCOUNT_DEACTIVATED,
      },
    });

    throw new UnauthorizedException(
      suspended
        ? USER_AUTH_ERROR_MESSAGE.ACCOUNT_SUSPENDED
        : USER_AUTH_ERROR_MESSAGE.ACCOUNT_DEACTIVATED,
    );
  }

  private async createSessionAndIssueTokens(
    userId: string,
    deviceId: string,
    platform: DevicePlatform,
    declared: DeclaredDevice | undefined,
  ): Promise<AuthResult> {
    const device = resolveDeviceContext(deviceId, platform, declared, this.requestContext.get());

    const session = await this.userSessionService.startForDevice({ userId, device });

    const refreshToken = await this.refreshTokenService.issue(session.id, userId);

    const accessToken = await this.jwtSigner.signAccessToken({ sub: userId, sid: session.id });

    this.requestContext.setIdentity({ userId, sessionId: session.id });

    return {
      status: AUTH_RESULT_STATUS.AUTHENTICATED,

      user: await this.buildAuthUser(userId),

      tokens: {
        accessToken,
        refreshToken: refreshToken.token,
        expiresIn: TOKEN_TTL_SECONDS.ACCESS,
      },
    };
  }

  private async challengeForVerification(
    userId: string,
    identifier: IdentifierInput,
  ): Promise<AuthResult> {
    await this.issueAndDeliver(
      EMAIL_TEMPLATE.OTP_VERIFICATION,
      identifier,
      verificationPurposeFor(identifier.type),
      userId,
      'login-verification-challenge',
    );

    return {
      status: AUTH_RESULT_STATUS.VERIFICATION_REQUIRED,

      user: await this.buildAuthUser(userId),

      tokens: null,
    };
  }
  private issueAndDeliver(
    template: CodeEmailTemplate,
    identifier: IdentifierInput,
    purpose: VerificationPurpose,
    userId: string,
    operation: string,
  ): Promise<void> {
    return this.transaction.run(async () => {
      const issued = await this.verificationCodeService.issueIfDue(identifier, purpose);

      if (issued !== null) {
        await this.deliverCode(template, identifier, issued, userId, operation);
      }
    });
  }

  private async notifyPasswordChanged(
    userId: string,
    method: PasswordChangeMethod,
    changedAt: Date,
    idempotencyKey: string,
  ): Promise<void> {
    const address = await this.userIdentityService.findEmailByUserId(userId);

    if (address === null) {
      return;
    }

    const user = await this.userService.getUserById(userId);

    if (user === null) {
      return;
    }

    await this.email.send(EMAIL_TEMPLATE.PASSWORD_CHANGED, {
      to: address,
      data: {
        firstName: user.firstName,
        method,
        changedAt: changedAt.toISOString(),
        signInUrl: this.appConfig.webUrl,
      },
      idempotencyKey,
      recipientRef: { userId },
    });
  }

  private async sendWelcome(userId: string, identifier: IdentifierInput): Promise<void> {
    if (identifier.type !== IdentifierType.EMAIL) {
      return;
    }

    const user = await this.userService.getUserById(userId);

    if (user === null) {
      return;
    }

    await this.email.send(EMAIL_TEMPLATE.WELCOME, {
      to: identifier.value,
      data: { firstName: user.firstName, dashboardUrl: this.appConfig.webUrl },
      idempotencyKey: `welcome-${userId}`,
      recipientRef: { userId },
    });
  }

  private async deliverCode(
    template: CodeEmailTemplate,
    identifier: IdentifierInput,
    issued: IssuedVerificationCode,
    userId: string,
    operation: string,
  ): Promise<void> {
    if (identifier.type !== IdentifierType.EMAIL) {
      this.logger.debug('No SMS transport yet — code not delivered', {
        context: USER_AUTH_LOG_CONTEXT,
        operation,
        metadata: { identifierType: identifier.type },
      });

      return;
    }

    await this.email.send(template, {
      to: identifier.value,
      data: { code: issued.code, expiresInMinutes: VERIFICATION_CODE_TTL_MINUTES },
      idempotencyKey: `verification-${issued.id}`,
      recipientRef: { userId },
      expiresAt: issued.expiresAt,
    });
  }

  private resolveConflictMessage(identifierType: IdentifierType): string {
    return identifierType === IdentifierType.EMAIL
      ? USER_AUTH_ERROR_MESSAGE.EMAIL_ALREADY_REGISTERED
      : USER_AUTH_ERROR_MESSAGE.PHONE_ALREADY_REGISTERED;
  }

  private buildDisplayName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`.trim();
  }

  private async buildAuthUser(userId: string): Promise<AuthUser> {
    const user = await this.userService.getUserById(userId);

    if (user === null) {
      throw new BadRequestException(VERIFICATION_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName ?? undefined,
      displayName: user.displayName,
    };
  }
}
