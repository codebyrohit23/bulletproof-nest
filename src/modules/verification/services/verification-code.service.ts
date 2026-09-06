import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { VerificationCode, VerificationPurpose } from '@prisma/client';

import { TokenService } from '#/core/security/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';
import type { IdentifierInput } from '#/shared/schemas/index.js';

import {
  VERIFICATION_CODE_MAX_ATTEMPTS,
  VERIFICATION_CODE_MIN_RESEND_INTERVAL_MS,
  VERIFICATION_ERROR_MESSAGE,
} from '../constants/index.js';
import { VerificationCodeRepository } from '../repositories/index.js';

@Injectable()
export class VerificationCodeService {
  constructor(
    private readonly verificationCodeRepo: VerificationCodeRepository,
    private readonly tokenService: TokenService,
    private readonly transaction: TransactionService,
  ) {}

  /**
   * Issues a code unless the one already out there is still fresh.
   *
   * Returns `null` for the fresh case, and that is not a failure: the code the
   * caller is asking for is in the user's inbox and still valid, so nothing is
   * sent and the caller carries on as if it had been.
   *
   * ---------------------------------------------------------------------------
   * WHY THIS IS NOT A RATE LIMIT
   * ---------------------------------------------------------------------------
   * How *often* an identifier may be sent a code is a quota, it is enforced at
   * the route by `RateLimitGuard`, and being over it earns a `429`. This is a
   * different question with a different answer.
   *
   * `issue` supersedes whatever code is currently live before writing the new
   * one. Mail is slow, so a user who taps "resend" eight seconds after the first
   * tap kills the code that is still in flight and receives a replacement that
   * invalidates the one they are about to read. The quota does not stop that —
   * two sends inside three seconds are comfortably inside any sane budget — and
   * a `429` would be the wrong answer anyway, because nothing was over a limit
   * and nothing went wrong.
   *
   * So the question here is only "is the live code still fresh", the state that
   * answers it is the live code's own `createdAt`, and no counter is involved.
   *
   * The interval is deliberately shorter than the client's resend timer. If the
   * two matched, clock skew would make a legitimate resend arrive a moment early
   * and be answered with silence — no new mail and no explanation.
   */
  async issueIfDue(
    identifier: IdentifierInput,
    purpose: VerificationPurpose,
  ): Promise<string | null> {
    const live = await this.verificationCodeRepo.findActive(
      identifier.type,
      identifier.value,
      purpose,
    );

    if (live !== null && isFresh(live)) {
      return null;
    }

    return this.issue(identifier, purpose);
  }

  private async issue(identifier: IdentifierInput, purpose: VerificationPurpose): Promise<string> {
    const code = this.tokenService.generateNumericCode();

    await this.transaction.run(async () => {
      await this.verificationCodeRepo.retireActive(identifier.type, identifier.value, purpose);

      await this.verificationCodeRepo.create({
        identifierType: identifier.type,
        identifierValue: identifier.value,
        purpose,
        codeHash: this.tokenService.hash(code),
      });
    });

    return code;
  }

  async verify(
    identifier: IdentifierInput,
    purpose: VerificationPurpose,
    code: string,
  ): Promise<string> {
    const record = await this.verificationCodeRepo.findActive(
      identifier.type,
      identifier.value,
      purpose,
    );

    if (record === null) {
      throw new BadRequestException(VERIFICATION_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      await this.verificationCodeRepo.markExpired(record.id);

      throw new BadRequestException(VERIFICATION_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }

    if (record.attempts >= VERIFICATION_CODE_MAX_ATTEMPTS) {
      await this.verificationCodeRepo.markBlocked(record.id);

      throw this.tooManyAttempts();
    }

    if (record.codeHash === null || !this.tokenService.compare(code, record.codeHash)) {
      const blocked = await this.verificationCodeRepo.recordFailedAttempt(
        record.id,
        VERIFICATION_CODE_MAX_ATTEMPTS,
      );

      if (blocked) {
        throw this.tooManyAttempts();
      }

      throw new BadRequestException(VERIFICATION_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }

    return record.id;
  }

  async consume(id: string): Promise<void> {
    const spent = await this.verificationCodeRepo.markConsumed(id);

    if (!spent) {
      throw new BadRequestException(VERIFICATION_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }
  }

  /**
   * About guessing a code, not about asking for one too often — a user who
   * confused the two would take the wrong action: stop guessing, versus wait.
   * Asking too often is the route's quota, and never reaches this service.
   */
  private tooManyAttempts(): HttpException {
    return new HttpException(
      VERIFICATION_ERROR_MESSAGE.TOO_MANY_CODE_ATTEMPTS,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

/**
 * An expired code can never be fresh — the interval is measured in seconds and
 * the TTL in minutes — so there is no expiry check here to keep in step with
 * one.
 */
function isFresh(record: VerificationCode): boolean {
  return Date.now() - record.createdAt.getTime() < VERIFICATION_CODE_MIN_RESEND_INTERVAL_MS;
}
