import {
  BadRequestException,
  ConflictException,
  Injectable,
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

import {
  AUTH_ERROR_MESSAGE,
  AUTH_FAILURE_REASON,
  type AuthFailureReason,
} from '#/core/auth/index.js';
import { RequestContextService } from '#/core/context/index.js';
import { JwtSignerService, TOKEN_TTL_SECONDS } from '#/core/jwt/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';
import {
  VERIFICATION_ERROR_MESSAGE,
  VerificationCodeService,
  verificationPurposeFor,
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
  VerifyCodeInput,
  VerifyResetOtpInput,
} from '../dto/index.js';
import {
  PASSWORD_RESET_TOKEN_OUTCOME,
  REFRESH_TOKEN_OUTCOME,
  type DeclaredDevice,
  type PasswordResetTokenOutcome,
} from '../interfaces/index.js';
import type { AuthUser } from '../schemas/index.js';
import { resolveDeviceContext } from '../utils/index.js';

import { UserCredentialService } from './user-credential.service.js';
import { UserIdentityService } from './user-identity.service.js';
import { UserPasswordResetTokenService } from './user-password-reset-token.service.js';
import { UserRefreshTokenService } from './user-refresh-token.service.js';
import { UserSessionService } from './user-session.service.js';
import { UserService } from './user.service.js';

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
  ) {}

  /**
   * Creates the account and puts a code in front of the identifier.
   *
   * Answers with a receipt rather than a session: nothing has been proven yet,
   * so there are no tokens to issue. `verifyRegistration` is where this flow
   * ends and where the first sign-in happens.
   *
   * ---------------------------------------------------------------------------
   * ONE REGISTRATION PER IDENTIFIER, VERIFIED OR NOT
   * ---------------------------------------------------------------------------
   * A taken identifier is refused, and *whether it has been verified makes no
   * difference*. The alternative — resuming an unverified account in place and
   * re-issuing a code — was tried and gives up more than it looks:
   *
   * - **Register becomes a resend endpoint.** Anyone can drive mail to an
   *   address by replaying this call, and the rate limiting that ought to sit on
   *   one flow now has to sit on two.
   * - **It overwrites a stranger's registration.** Resuming rewrites the name
   *   and the password of an account someone else started, so a second caller
   *   could sit on a half-finished sign-up and swap the credentials under it.
   *
   * What that costs is real and is paid elsewhere: someone can register an
   * address they do not own and leave it unverified, and the true owner then
   * meets a `409` for an account they never made. Password reset is the way out
   * — its code proves the mailbox exactly as a verification code does, so
   * completing a reset both sets the password and marks the identifier verified.
   * That flow is what keeps this refusal from being a dead end, which is why it
   * is not optional.
   */
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

      /*
       * `null` cannot happen for a fresh identifier — the conflict above rules
       * out anyone who has sent to it recently. It is handled rather than
       * asserted because what this call really does here is *start* the
       * cooldown, so that an impatient tap on "resend" a second later is
       * skipped instead of superseding a code that has only just been sent.
       */
      const code = await this.verificationCodeService.issueIfDue(
        identifier,
        verificationPurposeFor(identifier.type),
      );

      if (code !== null) {
        this.logger.debug('otp code', {
          context: USER_AUTH_LOG_CONTEXT,
          operation: 'register-user',
          metadata: { code },
        });
      }

      /*
       * TODO: dispatch the delivery job, guarded by the same `code !== null`.
       *
       *   await this.jobs.dispatch(QUEUE.MAIL, USER_AUTH_SEND_VERIFICATION_CODE, {
       *     identifierType: identifier.type,
       *     identifierValue: identifier.value,
       *     code,
       *   });
       *
       * Three things worth settling before writing it:
       *
       * - **The payload carries the code itself**, which is the one documented
       *   exception to "payloads carry ids, not documents" in
       *   `infrastructure/queue`. It has to: only the hash is stored, so a
       *   worker cannot re-read the plaintext. It is short-lived in Redis and
       *   becomes useless when the code expires.
       * - **`JobDispatcher` already defers to after the commit**, so calling it
       *   here, inside the transaction, is correct rather than racy — a worker
       *   cannot pick the job up before the rows it describes are committed.
       * - **Handlers must be idempotent.** A retry here re-sends the same code,
       *   which is acceptable. A retry that *issued* a new one would not be,
       *   which is why issuing happens here and delivery happens there.
       *
       * `QUEUE.MAIL` fits an email address; there is no SMS queue yet, and
       * choosing per identifier type is the producer's decision to make then.
       */
      void code;

      /*
       * The identifier is echoed back as the schema normalised it — trimmed,
       * lower-cased — rather than as the client sent it. That is the value the
       * code was addressed to and the value `verifyRegistration` will match on,
       * so handing back anything else invites a verification screen that shows
       * one address while the message went to another.
       */
      return { userId, identifier, verificationRequired: true };
    });
  }

  /**
   * Proves the identifier a registration was started with, and signs it in.
   *
   * The mirror of `registerUser`: that one creates the account and puts a code
   * in front of the identifier, this one takes the code back and records that
   * the identifier was proven. Named for the flow rather than for the route —
   * `verifyCode` would read fine today and read wrong the moment `LOGIN` and
   * `PASSWORD_RESET` codes arrive, since those verify the same way and prove
   * something else entirely.
   *
   * The account itself is `ACTIVE` from the moment it is created and is never
   * touched here. `users.status` describes an account's lifecycle — live,
   * self-deactivated, suspended by an administrator — and has nothing to say
   * about whether a mailbox answered. That fact lives on
   * `user_identities.verified_at`, in one place, which is what stops the two
   * from ever disagreeing.
   *
   * ---------------------------------------------------------------------------
   * WHY IT RETURNS TOKENS RATHER THAN A USER
   * ---------------------------------------------------------------------------
   * The code *is* a credential — single-use, rate-limited, time-boxed proof of
   * possession of the identifier — and it has just been spent. Handing back a
   * user object and sending the client to `/auth/login` would charge a second
   * credential for the same proof, and for a phone-first account there is no
   * second credential to charge: `password` is optional at registration.
   *
   * So this is the account's first sign-in, and it goes through the same door a
   * password login does. `createSessionAndIssueTokens` is called rather than
   * reimplemented for that reason: one place establishes a session, so device
   * binding, supersession and token issuance cannot come to mean two different
   * things depending on how the user arrived.
   *
   * ---------------------------------------------------------------------------
   * WHY THE CODE IS JUDGED BEFORE THE TRANSACTION OPENS
   * ---------------------------------------------------------------------------
   * `verify` writes on every failure path — the attempt counter, and the
   * status that retires a lapsed or exhausted code — and a write made inside a
   * transaction that then throws is a write that never happened. The limit
   * only counts if the guess is judged outside. `consume` — the guarded update
   * that makes the code single-use — goes back inside, so the code is spent
   * exactly when the verification it paid for is committed, and a failure below
   * hands the code back rather than burning it.
   *
   * The session is established after that transaction commits, and deliberately
   * outside it: signing a JWT and evicting a cache entry are not database work,
   * for the reasons `createSessionAndIssueTokens` sets out. A failure there
   * leaves a verified account with no session — the user signs in normally and
   * is unblocked — whereas the reverse ordering could hand out tokens for a
   * verification that then rolled back.
   *
   * ---------------------------------------------------------------------------
   * WHAT AN UNKNOWN IDENTIFIER RETURNS
   * ---------------------------------------------------------------------------
   * The same `INVALID_OR_EXPIRED_CODE` as a wrong code. Registration is already
   * a membership oracle by decision, and there is no reason to add a second,
   * cheaper one here — this endpoint takes no password and would otherwise let
   * anyone sort a list of addresses by reading two different errors.
   *
   * ---------------------------------------------------------------------------
   * IDEMPOTENCY AND STATE
   * ---------------------------------------------------------------------------
   * `markVerified` is guarded on `verifiedAt: null` rather than written blind,
   * so a second successful verification stamps nothing and the original proof
   * keeps its date.
   *
   * A `SUSPENDED` account that proves an identifier gets the identifier
   * recorded and stays suspended — verification is proof of possession, never a
   * route back to privileges an administrator removed. That is why the session
   * is gated below rather than started unconditionally: without the gate this
   * endpoint would be the one door in the system that hands a suspended user a
   * live session, and it would do it while every surrounding write behaved
   * correctly.
   */
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
    });

    /*
     * Read before the transaction, and that is sufficient: nothing in this flow
     * writes `users.status`, so a row that was `SUSPENDED` when it was read is
     * `SUSPENDED` still. A suspension landing inside that window is not closed
     * here — it is closed where every other session is, by the revocation that
     * accompanies a suspension.
     *
     * The identifier stays verified either way. Proof of possession is a fact
     * about the mailbox, not a privilege, so it is recorded above and then the
     * session is refused separately.
     */
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

    const code = await this.verificationCodeService.issueIfDue(identifier, purpose);

    if (code === null) {
      return null;
    }

    this.logger.debug('otp code', {
      context: USER_AUTH_LOG_CONTEXT,
      operation: 'resend-verification',
      metadata: { code },
    });

    /* TODO: dispatch the delivery job — see the note in `registerUser`. */

    return null;
  }

  async login(payload: LoginInput): Promise<AuthResult> {
    const { email, password, platform, device } = payload;

    const deviceId = this.requireDeviceId('login');

    const existing = await this.userIdentityService.findIdentityWithUserAndCredential(
      IdentifierType.EMAIL,
      email,
    );

    this.logger.debug('email login', {
      context: USER_AUTH_LOG_CONTEXT,
      operation: 'email-login',
      metadata: { email: existing?.identifierValue },
    });

    if (!existing || !existing.user.credential) {
      throw new BadRequestException(USER_AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS);
    }

    await this.userCredentialService.verifyPassword(
      existing.user.id,
      password,
      existing.user.credential.passwordHash,
    );

    /* Past this line the account is proven to belong to the caller. */

    this.assertAccountCanSignIn(existing.user.status, existing.userId, 'login');

    if (existing.verifiedAt === null) {
      /*
       * Rebuilt from the stored row rather than from the request, so the code is
       * addressed to the value the account actually holds — normalised, and the
       * same value `/auth/verification/verify` will look up. The literal `EMAIL`
       * is not an assumption: this endpoint took an email and looked one up.
       */
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

    const code = await this.verificationCodeService.issueIfDue(
      identifier,
      VerificationPurpose.LOGIN,
    );

    if (code === null) {
      return null;
    }

    this.logger.debug('otp code', {
      context: USER_AUTH_LOG_CONTEXT,
      operation: 'request-login-otp',
      metadata: { code },
    });

    /* TODO: dispatch the delivery job — see the note in `registerUser`. */

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

    const code = await this.verificationCodeService.issueIfDue(
      { type: IdentifierType.EMAIL, value: email },
      VerificationPurpose.PASSWORD_RESET,
    );

    if (code === null) {
      return null;
    }

    this.logger.debug('otp code', {
      context: USER_AUTH_LOG_CONTEXT,
      operation: 'request-password-reset-otp',
      metadata: { code },
    });

    /* TODO: dispatch the delivery job — see the note in `registerUser`. */

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

      await this.userCredentialService.setCredential(userId, password);

      await this.userSessionService.revokeAllForUser(userId, SessionRevokeReason.PASSWORD_RESET);
    });

    return null;
  }

  /**
   * Replaces a password for someone already signed in, and signs out the rest.
   *
   * Every other session goes; this one stays. The caller has just retyped the
   * current password, so the device in front of them is the one identity that
   * has been re-proven — and revoking it would only send them through a login
   * screen with the password they chose seconds ago.
   *
   * That makes this the opposite of `resetPassword`, which revokes everything:
   * a reset is entered by someone with no session, possibly because the account
   * is already in someone else's hands.
   */
  async changePassword(payload: ChangePasswordInput): Promise<null> {
    const userId = this.requireUserId('change-password');
    const sessionId = this.requireSessionId('change-password');

    const credential = await this.userCredentialService.findCredentialByUserId(userId);

    if (!credential) {
      throw new BadRequestException(USER_AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS);
    }

    const { currentPassword, newPassword } = payload;

    await this.userCredentialService.verifyPassword(
      userId,
      currentPassword,
      credential.passwordHash,
    );

    await this.transaction.run(async () => {
      await this.userCredentialService.setCredential(userId, newPassword);

      await this.userSessionService.revokeAllForUser(
        userId,
        SessionRevokeReason.PASSWORD_CHANGED,
        sessionId,
      );
    });

    return null;
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

  /**
   * Reads the identity `UserAuthGuard` established, or refuses.
   *
   * The guard runs before every caller of this and sets both ids together, so
   * an absent one is not a client mistake — it means the route lost its guard.
   * Hence the same `401` the guard itself would have answered, rather than a
   * `400` about credentials the caller never sent, and hence the log: it is the
   * only place that fault becomes visible.
   */
  private requireUserId(operation: string): string {
    const userId = this.requestContext.userId;

    if (userId === undefined) {
      this.refuseUnidentified(operation);
    }

    return userId;
  }

  /** The session half of `requireUserId`; `setIdentity` writes both or neither. */
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

    const refreshToken = await this.refreshTokenService.issue(session.id);

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
    const code = await this.verificationCodeService.issueIfDue(
      identifier,
      verificationPurposeFor(identifier.type),
    );

    if (code !== null) {
      this.logger.debug('otp code', {
        context: USER_AUTH_LOG_CONTEXT,
        operation: 'login-verification-challenge',
        metadata: { code },
      });

      /* TODO: dispatch the delivery job — see the note in `registerUser`. */
    }

    return {
      status: AUTH_RESULT_STATUS.VERIFICATION_REQUIRED,

      user: await this.buildAuthUser(userId),

      tokens: null,
    };
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
