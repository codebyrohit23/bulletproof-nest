import type { VerificationPurpose } from '@prisma/client';

/**
 * The purposes an admin code can carry. The enum is shared with users, but an
 * admin has no phone and proves their address by resetting the password, so
 * `EMAIL_VERIFICATION` and `PHONE_VERIFICATION` are not reachable here — a
 * call that passed one would fail to compile rather than issue a code no flow
 * answers.
 */
export type AdminCodePurpose =
  typeof VerificationPurpose.PASSWORD_RESET | typeof VerificationPurpose.LOGIN;

export interface CreateAdminVerificationCodeInput {
  readonly adminId: string;

  readonly purpose: AdminCodePurpose;

  readonly codeHash: string;
}

export interface IssuedAdminVerificationCode {
  readonly id: string;

  readonly code: string;

  readonly expiresAt: Date;
}
