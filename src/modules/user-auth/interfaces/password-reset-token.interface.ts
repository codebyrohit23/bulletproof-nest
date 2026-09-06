import type { PasswordResetTokenStatus, UserStatus } from '@prisma/client';

export interface CreatePasswordResetTokenInput {
  readonly userId: string;

  readonly tokenHash: string;
}

/**
 * A reset token as the redemption needs to see it.
 *
 * Spelled out rather than derived with `Prisma.…GetPayload`, so the repository
 * can `select` these columns instead of loading whole rows — and so adding a
 * column to the model does not silently widen what leaves the repository.
 *
 * `tokenHash` is deliberately absent. The caller already holds the token it
 * looked the row up with; handing the hash back would only be a second copy of
 * a credential to keep track of.
 */
export interface PasswordResetTokenWithUser {
  readonly id: string;

  readonly userId: string;

  readonly status: PasswordResetTokenStatus;

  readonly expiresAt: Date;

  readonly user: {
    readonly status: UserStatus;
  };
}

export interface IssuedPasswordResetToken {
  readonly token: string;

  readonly expiresAt: Date;
}

/**
 * Why a presented token was accepted or turned away.
 *
 * Every refusal answers the client the same `401` — telling someone which of
 * these they hit would confirm that a token once existed. The distinction is
 * for the log, and it earns its keep there: `SUPERSEDED` and `EXPIRED` are a
 * user being slow or asking twice, while `CONSUMED` means a spent token came
 * back, which is either a replay or a leaked string.
 */
export const PASSWORD_RESET_TOKEN_OUTCOME = {
  VALID: 'VALID',

  CONSUMED: 'CONSUMED',

  SUPERSEDED: 'SUPERSEDED',

  EXPIRED: 'EXPIRED',

  UNKNOWN: 'UNKNOWN',
} as const;

export type PasswordResetTokenOutcome =
  (typeof PASSWORD_RESET_TOKEN_OUTCOME)[keyof typeof PASSWORD_RESET_TOKEN_OUTCOME];

type PasswordResetTokenRefusal =
  | typeof PASSWORD_RESET_TOKEN_OUTCOME.CONSUMED
  | typeof PASSWORD_RESET_TOKEN_OUTCOME.SUPERSEDED
  | typeof PASSWORD_RESET_TOKEN_OUTCOME.EXPIRED;

/**
 * `UNKNOWN` is the one outcome with no row behind it — nothing matched the
 * hash, so there is nothing to report. Every other outcome carries the token it
 * found, which is what lets a caller log *whose* reset was replayed rather than
 * only that one was.
 */
export type PasswordResetTokenVerification =
  | {
      readonly outcome: typeof PASSWORD_RESET_TOKEN_OUTCOME.VALID;
      readonly token: PasswordResetTokenWithUser;
    }
  | {
      readonly outcome: PasswordResetTokenRefusal;
      readonly token: PasswordResetTokenWithUser;
    }
  | { readonly outcome: typeof PASSWORD_RESET_TOKEN_OUTCOME.UNKNOWN };
