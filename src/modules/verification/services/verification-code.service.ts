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
import type { IssuedVerificationCode } from '../interfaces/index.js';
import { VerificationCodeRepository } from '../repositories/index.js';

@Injectable()
export class VerificationCodeService {
  constructor(
    private readonly verificationCodeRepo: VerificationCodeRepository,
    private readonly tokenService: TokenService,
    private readonly transaction: TransactionService,
  ) {}

  async issueIfDue(
    identifier: IdentifierInput,
    purpose: VerificationPurpose,
  ): Promise<IssuedVerificationCode | null> {
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

  private async issue(
    identifier: IdentifierInput,
    purpose: VerificationPurpose,
  ): Promise<IssuedVerificationCode> {
    const code = this.tokenService.generateNumericCode();

    const record = await this.transaction.run(async () => {
      await this.verificationCodeRepo.retireActive(identifier.type, identifier.value, purpose);

      return this.verificationCodeRepo.create({
        identifierType: identifier.type,
        identifierValue: identifier.value,
        purpose,
        codeHash: this.tokenService.hash(code),
      });
    });

    return { id: record.id, code };
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
