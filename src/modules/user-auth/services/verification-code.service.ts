import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { VerificationPurpose } from '@prisma/client';

import { TokenService } from '#/core/security/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';

import { USER_AUTH_ERROR_MESSAGE, VERIFICATION_CODE_MAX_ATTEMPTS } from '../constants/index.js';
import { VerificationCodeRepository } from '../repositories/index.js';
import type { IdentifierInput } from '../schemas/index.js';

@Injectable()
export class VerificationCodeService {
  constructor(
    private readonly verificationCodeRepo: VerificationCodeRepository,

    private readonly tokenService: TokenService,

    private readonly transaction: TransactionService,
  ) {}

  async issue(identifier: IdentifierInput, purpose: VerificationPurpose): Promise<string> {
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
