import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { UserVerificationCode, VerificationPurpose } from '@prisma/client';

import { TokenService } from '#/core/security/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';

import {
  USER_AUTH_ERROR_MESSAGE,
  VERIFICATION_CODE_MAX_ATTEMPTS,
  VERIFICATION_CODE_MIN_RESEND_INTERVAL_MS,
} from '../constants/index.js';
import type { IssuedVerificationCode } from '../interfaces/index.js';
import { UserVerificationCodeRepository } from '../repositories/index.js';

/**
 * Codes are addressed by identity id, never by address. A caller must have
 * found the identity first — which every flow already does, to refuse an
 * unknown address — and a code can then only ever answer for the identity it
 * was sent to: a code mailed to a user's email cannot verify their phone.
 */
@Injectable()
export class UserVerificationCodeService {
  constructor(
    private readonly verificationCodeRepo: UserVerificationCodeRepository,
    private readonly tokenService: TokenService,
    private readonly transaction: TransactionService,
  ) {}

  async issueIfDue(
    identityId: string,
    purpose: VerificationPurpose,
  ): Promise<IssuedVerificationCode | null> {
    const live = await this.verificationCodeRepo.findActive(identityId, purpose);

    if (live !== null && isFresh(live)) {
      return null;
    }

    return this.issue(identityId, purpose);
  }

  private async issue(
    identityId: string,
    purpose: VerificationPurpose,
  ): Promise<IssuedVerificationCode> {
    const code = this.tokenService.generateVerificationCode();

    const record = await this.transaction.run(async () => {
      await this.verificationCodeRepo.retireActive(identityId, purpose);

      return this.verificationCodeRepo.create({
        userIdentityId: identityId,
        purpose,
        codeHash: this.tokenService.hash(code),
      });
    });

    return { id: record.id, code, expiresAt: record.expiresAt };
  }

  async verify(identityId: string, purpose: VerificationPurpose, code: string): Promise<string> {
    const record = await this.verificationCodeRepo.findActive(identityId, purpose);

    if (record === null) {
      throw new BadRequestException(USER_AUTH_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      await this.verificationCodeRepo.markExpired(record.id);

      throw new BadRequestException(USER_AUTH_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
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

      throw new BadRequestException(USER_AUTH_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }

    return record.id;
  }

  async consume(id: string): Promise<void> {
    const spent = await this.verificationCodeRepo.markConsumed(id);

    if (!spent) {
      throw new BadRequestException(USER_AUTH_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }
  }

  private tooManyAttempts(): HttpException {
    return new HttpException(
      USER_AUTH_ERROR_MESSAGE.TOO_MANY_CODE_ATTEMPTS,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

function isFresh(record: UserVerificationCode): boolean {
  return Date.now() - record.createdAt.getTime() < VERIFICATION_CODE_MIN_RESEND_INTERVAL_MS;
}
