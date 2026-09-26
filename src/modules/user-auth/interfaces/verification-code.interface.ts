import type { UserVerificationPurpose } from '@prisma/client';

export interface CreateVerificationCodeInput {
  readonly userIdentityId: string;

  readonly purpose: UserVerificationPurpose;

  readonly codeHash: string;
}

export interface IssuedVerificationCode {
  readonly id: string;

  readonly code: string;

  readonly expiresAt: Date;
}
