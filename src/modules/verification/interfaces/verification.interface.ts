import type { IdentifierType, VerificationPurpose } from '@prisma/client';
export interface IssuedVerificationCode {
  readonly id: string;

  readonly code: string;

  readonly expiresAt: Date;
}

export interface IssueVerificationCodeInput {
  readonly identifierType: IdentifierType;

  readonly identifierValue: string;

  readonly purpose: VerificationPurpose;

  readonly codeHash: string;
}
