import type { PasswordResetTokenStatus } from '@prisma/client';

export interface CreateAdminPasswordResetTokenInput {
  readonly adminId: string;

  readonly tokenHash: string;
}

export interface IssuedAdminPasswordResetToken {
  readonly token: string;

  readonly expiresAt: Date;
}

/**
 * A reset token as redemption needs it. No `tokenHash` — the caller already
 * holds the token — and no admin status: that is read fresh from `admins` at
 * redemption, because an admin can be suspended after the token was issued.
 */
export interface AdminPasswordResetTokenRecord {
  readonly id: string;

  readonly adminId: string;

  readonly status: PasswordResetTokenStatus;

  readonly expiresAt: Date;
}

/**
 * Why a presented token was accepted or turned away. Every refusal answers the
 * client with the same `401`; the distinction is for the log, where `CONSUMED`
 * — a spent token presented again — is the one worth a second look.
 */
export const ADMIN_PASSWORD_RESET_TOKEN_OUTCOME = {
  VALID: 'VALID',

  CONSUMED: 'CONSUMED',

  SUPERSEDED: 'SUPERSEDED',

  EXPIRED: 'EXPIRED',

  UNKNOWN: 'UNKNOWN',
} as const;

export type AdminPasswordResetTokenOutcome =
  (typeof ADMIN_PASSWORD_RESET_TOKEN_OUTCOME)[keyof typeof ADMIN_PASSWORD_RESET_TOKEN_OUTCOME];

/** `UNKNOWN` is the one outcome with no row behind it; every other carries the token it found. */
export type AdminPasswordResetTokenVerification =
  | {
      readonly outcome: Exclude<
        AdminPasswordResetTokenOutcome,
        typeof ADMIN_PASSWORD_RESET_TOKEN_OUTCOME.UNKNOWN
      >;
      readonly token: AdminPasswordResetTokenRecord;
    }
  | { readonly outcome: typeof ADMIN_PASSWORD_RESET_TOKEN_OUTCOME.UNKNOWN };
