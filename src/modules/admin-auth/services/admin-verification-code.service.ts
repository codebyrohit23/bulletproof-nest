import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { AdminVerificationCode } from '@prisma/client';

import { TokenService } from '#/core/security/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';

import {
  ADMIN_AUTH_ERROR_MESSAGE,
  ADMIN_VERIFICATION_CODE_MAX_ATTEMPTS,
  ADMIN_VERIFICATION_CODE_MIN_RESEND_INTERVAL_MS,
} from '../constants/index.js';
import type { AdminCodePurpose, IssuedAdminVerificationCode } from '../interfaces/index.js';
import { AdminVerificationCodeRepository } from '../repositories/index.js';

/**
 * The same lifecycle as `UserVerificationCodeService`, over its own table.
 *
 * Deliberately a second copy rather than one service generic over both: the
 * shared part is a hundred lines, a generic repository across two Prisma
 * delegates is heavy typing for two callers, and the two policies are meant to
 * be free to drift apart.
 */
@Injectable()
export class AdminVerificationCodeService {
  constructor(
    private readonly verificationCodeRepo: AdminVerificationCodeRepository,
    private readonly tokenService: TokenService,
    private readonly transaction: TransactionService,
  ) {}

  async issueIfDue(
    adminId: string,
    purpose: AdminCodePurpose,
  ): Promise<IssuedAdminVerificationCode | null> {
    const live = await this.verificationCodeRepo.findActive(adminId, purpose);

    if (live !== null && isFresh(live)) {
      return null;
    }

    return this.issue(adminId, purpose);
  }

  private async issue(
    adminId: string,
    purpose: AdminCodePurpose,
  ): Promise<IssuedAdminVerificationCode> {
    const code = this.tokenService.generateVerificationCode();

    const record = await this.transaction.run(async () => {
      await this.verificationCodeRepo.retireActive(adminId, purpose);

      return this.verificationCodeRepo.create({
        adminId,
        purpose,
        codeHash: this.tokenService.hash(code),
      });
    });

    return { id: record.id, code, expiresAt: record.expiresAt };
  }

  async verify(adminId: string, purpose: AdminCodePurpose, code: string): Promise<string> {
    const record = await this.verificationCodeRepo.findActive(adminId, purpose);

    if (record === null) {
      throw new BadRequestException(ADMIN_AUTH_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }

    if (record.expiresAt.getTime() <= Date.now()) {
      await this.verificationCodeRepo.markExpired(record.id);

      throw new BadRequestException(ADMIN_AUTH_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }

    if (record.attempts >= ADMIN_VERIFICATION_CODE_MAX_ATTEMPTS) {
      await this.verificationCodeRepo.markBlocked(record.id);

      throw this.tooManyAttempts();
    }

    if (record.codeHash === null || !this.tokenService.compare(code, record.codeHash)) {
      const blocked = await this.verificationCodeRepo.recordFailedAttempt(
        record.id,
        ADMIN_VERIFICATION_CODE_MAX_ATTEMPTS,
      );

      if (blocked) {
        throw this.tooManyAttempts();
      }

      throw new BadRequestException(ADMIN_AUTH_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }

    return record.id;
  }

  async consume(id: string): Promise<void> {
    const spent = await this.verificationCodeRepo.markConsumed(id);

    if (!spent) {
      throw new BadRequestException(ADMIN_AUTH_ERROR_MESSAGE.INVALID_OR_EXPIRED_CODE);
    }
  }

  private tooManyAttempts(): HttpException {
    return new HttpException(
      ADMIN_AUTH_ERROR_MESSAGE.TOO_MANY_CODE_ATTEMPTS,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

function isFresh(record: AdminVerificationCode): boolean {
  return Date.now() - record.createdAt.getTime() < ADMIN_VERIFICATION_CODE_MIN_RESEND_INTERVAL_MS;
}
