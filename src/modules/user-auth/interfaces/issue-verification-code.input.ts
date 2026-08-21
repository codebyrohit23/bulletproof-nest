import type { IdentifierType, VerificationPurpose } from '@prisma/client';

/**
 * What it takes to put a fresh code in front of an identifier.
 *
 * `codeHash`, never `code`. The plaintext exists only long enough to be handed
 * to the job that delivers it — a repository that accepted it would be one
 * refactor away from storing it, and a leaked table of live codes is a leaked
 * table of accounts.
 *
 * `attempts`, `status` and `expiresAt` are absent for the same reason: attempts
 * always starts at zero, a new row is always ACTIVE, and the expiry is derived
 * from a single TTL constant rather than chosen per call site, where two
 * callers would eventually disagree about how long a code lives.
 */
export interface IssueVerificationCodeInput {
  readonly identifierType: IdentifierType;

  readonly identifierValue: string;

  readonly purpose: VerificationPurpose;

  readonly codeHash: string;
}
