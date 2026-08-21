import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { IdentifierType, UserState, VerificationPurpose } from '@prisma/client';

import { AppLoggerService } from '#/core/logger/index.js';
import { PasswordService } from '#/core/security/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';

import { USER_AUTH_ERROR_MESSAGE, USER_AUTH_LOG_CONTEXT } from '../constants/index.js';
import type { AuthUser, LoginInput, RegisterInput, VerifyCodeInput } from '../dto/index.js';

import { UserCredentialService } from './user-credential.service.js';
import { UserIdentityService } from './user-identity.service.js';
import { UserService } from './user.service.js';
import { VerificationCodeService } from './verification-code.service.js';

@Injectable()
export class UserAuthService {
  constructor(
    private readonly logger: AppLoggerService,

    private readonly userService: UserService,

    private readonly userIdentityService: UserIdentityService,

    private readonly userCredentialService: UserCredentialService,

    private readonly verificationCodeService: VerificationCodeService,

    private readonly transaction: TransactionService,

    private readonly passwordService: PasswordService,
  ) {}

  public async registerUser(payload: RegisterInput): Promise<void> {
    const { identifier } = payload;

    const existing = await this.userIdentityService.findIdentityWithUser(
      identifier.type,
      identifier.value,
    );

    if (existing !== null && existing.user.state !== UserState.PENDING) {
      throw new ConflictException(this.resolveConflictMessage(identifier.type));
    }

    return this.transaction.run(async () => {
      if (existing === null) {
        await this.createAccount(payload);
      } else {
        await this.resumeAccount(existing.userId, payload);
      }

      const code = await this.verificationCodeService.issue(
        identifier,
        VerificationPurpose.REGISTER,
      );

      this.logger.debug('otp code', {
        context: USER_AUTH_LOG_CONTEXT,
        operation: 'register-user',
        metadata: { code: code },
      });
      /*
       * TODO: dispatch the delivery job.
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

      // return this.buildPendingVerification(userId, identifier);
    });
  }

  /**
   * Turns a pending registration into a usable account.
   *
   * The mirror of `registerUser`: that one creates a `PENDING` user and puts a
   * code in front of the identifier, this one takes the code back and promotes
   * the account. Named for the flow rather than for the route — `verifyCode`
   * would read fine today and read wrong the moment `LOGIN` and
   * `PASSWORD_RESET` codes arrive, since those verify the same way and activate
   * nothing.
   *
   * ---------------------------------------------------------------------------
   * WHY THE CODE IS JUDGED BEFORE THE TRANSACTION OPENS
   * ---------------------------------------------------------------------------
   * `verify` writes on every failure path — the attempt counter, and the
   * status that retires a lapsed or exhausted code — and a write made inside a
   * transaction that then throws is a write that never happened. The limit
   * only counts if the guess is judged outside. `consume` — the guarded update
   * that makes the code single-use — goes back inside, so the code is spent
   * exactly when the activation it paid for is committed, and a failure below
   * hands the code back rather than burning it.
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
   * Both writes are guarded rather than blind: `markVerified` on
   * `verifiedAt: null`, `activate` on `state: PENDING`. A `SUSPENDED` account
   * that proves an identifier therefore gets the identifier recorded and stays
   * suspended — verification is proof of possession, never a route back to
   * privileges an administrator removed.
   */
  public async verifyRegistration(payload: VerifyCodeInput): Promise<AuthUser> {
    const { identifier, code } = payload;

    const target = await this.userIdentityService.findIdentityWithUser(
      identifier.type,
      identifier.value,
    );

    if (target === null) {
      throw new BadRequestException(USER_AUTH_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }

    const codeId = await this.verificationCodeService.verify(
      identifier,
      VerificationPurpose.REGISTER,
      code,
    );

    return this.transaction.run(async () => {
      await this.verificationCodeService.consume(codeId);

      await this.userIdentityService.markVerified(target.id);

      await this.userService.activateUserAccount(target.userId);

      return this.buildAuthUser(target.userId);
    });
  }

  public async login(payload: LoginInput): Promise<AuthUser> {
    const { email, password } = payload;

    const existing = await this.userIdentityService.findIdentityWithUserAndCredential(
      IdentifierType.EMAIL,
      email,
    );

    this.logger.debug('email login', {
      context: USER_AUTH_LOG_CONTEXT,
      operation: 'email-login',
      metadata: { email: existing?.identifierValue },
    });

    if (!existing || existing.user.state === UserState.PENDING || !existing.verifiedAt) {
      throw new BadRequestException(USER_AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS);
    }

    if (
      !existing.user.credential ||
      !(await this.passwordService.verify(existing.user.credential.passwordHash, password))
    ) {
      throw new BadRequestException(USER_AUTH_ERROR_MESSAGE.INVALID_CREDENTIALS);
    }

    return this.buildAuthUser(existing.userId);
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

    /*
     * Absent for a phone registration, which authenticates by one-time code.
     * `registerSchema` guarantees the correlation — an email registration
     * always carries a password and a phone one never does — but that is a
     * runtime refinement TypeScript cannot see, so the narrowing is real.
     */
    if (password !== undefined) {
      await this.userCredentialService.createCredential(user.id, password);
    }

    return user.id;
  }

  private async resumeAccount(userId: string, payload: RegisterInput): Promise<string> {
    const { firstName, lastName, password } = payload;

    await this.userService.updatePendingProfile(userId, {
      firstName,
      lastName,
      displayName: this.buildDisplayName(firstName, lastName),
    });

    if (password !== undefined) {
      await this.userCredentialService.setCredential(userId, password);
    }

    return userId;
  }

  private resolveConflictMessage(identifierType: IdentifierType): string {
    return identifierType === IdentifierType.EMAIL
      ? USER_AUTH_ERROR_MESSAGE.EMAIL_ALREADY_REGISTERED
      : USER_AUTH_ERROR_MESSAGE.PHONE_ALREADY_REGISTERED;
  }

  // private buildPendingVerification(userId: string, identifier: IdentifierInput): RegisterResponse {
  //   return {
  //     userId,
  //     identifier,
  //     verificationRequired: true,
  //   };
  // }

  private buildDisplayName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`.trim();
  }

  /**
   * The freshly activated account, narrowed to what a client may see.
   *
   * Re-read rather than returned from the write, because `activate` is an
   * `updateMany` — guarded on `PENDING`, so it reports a count and not a row.
   * The read happens inside the same transaction, so it observes the activation
   * that just ran.
   *
   * The fields are picked explicitly instead of spreading the row. `AuthUserDto`
   * strips anything it does not name on the way out, so a spread would not leak
   * today; it would leak the day someone returns this object from a path that
   * is not serialised. Narrowing at the source costs one line and does not
   * depend on a decorator being present three files away.
   *
   * A `null` here is unreachable through the front door — the identity was just
   * resolved and rows are soft-deleted, not removed — but it is reachable if an
   * account is deleted mid-flow, and the code proves possession of an
   * identifier, not the continued existence of an account.
   */
  private async buildAuthUser(userId: string): Promise<AuthUser> {
    const user = await this.userService.getUserById(userId);

    if (user === null) {
      throw new BadRequestException(USER_AUTH_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }

    return {
      id: user.id,
      displayName: user.displayName,
      avatarFileId: user.avatarFileId,
    };
  }
}
