import type { Prisma } from '@prisma/client';

export interface CreateRefreshTokenInput {
  readonly sessionId: string;

  readonly tokenHash: string;
}

export type RefreshTokenWithSession = Prisma.UserRefreshTokenGetPayload<{
  include: { session: true };
}>;

export interface IssuedRefreshToken {
  readonly token: string;

  readonly expiresAt: Date;
}

export const REFRESH_TOKEN_OUTCOME = {
  VALID: 'VALID',

  REUSED: 'REUSED',

  EXPIRED: 'EXPIRED',

  UNKNOWN: 'UNKNOWN',
} as const;

export type RefreshTokenOutcome =
  (typeof REFRESH_TOKEN_OUTCOME)[keyof typeof REFRESH_TOKEN_OUTCOME];

export type RefreshTokenVerification =
  | {
      readonly outcome: typeof REFRESH_TOKEN_OUTCOME.VALID;
      readonly token: RefreshTokenWithSession;
    }
  | {
      readonly outcome: typeof REFRESH_TOKEN_OUTCOME.REUSED;
      readonly token: RefreshTokenWithSession;
    }
  | {
      readonly outcome: typeof REFRESH_TOKEN_OUTCOME.EXPIRED;
      readonly token: RefreshTokenWithSession;
    }
  | { readonly outcome: typeof REFRESH_TOKEN_OUTCOME.UNKNOWN };
