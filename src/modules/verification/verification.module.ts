import { Module } from '@nestjs/common';

import { VerificationCodeRepository } from './repositories/index.js';
import { VerificationCodeService } from './services/verification-code.service.js';

@Module({
  providers: [VerificationCodeRepository, VerificationCodeService],
  exports: [VerificationCodeService],
})
export class VerificationModule {}
