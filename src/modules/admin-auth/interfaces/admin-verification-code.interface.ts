import type { AdminVerificationPurpose } from '@prisma/client';

export interface CreateAdminVerificationCodeInput {
  readonly adminId: string;

  readonly purpose: AdminVerificationPurpose;

  readonly codeHash: string;
}

export interface IssuedAdminVerificationCode {
  readonly id: string;

  readonly code: string;

  readonly expiresAt: Date;
}
