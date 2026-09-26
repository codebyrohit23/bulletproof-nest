import type { Prisma } from '@prisma/client';

export interface CreateAdminRefreshTokenInput {
  readonly adminId: string;

  readonly sessionId: string;

  readonly tokenHash: string;
}

export interface IssuedAdminRefreshToken {
  readonly token: string;

  readonly expiresAt: Date;
}

export type AdminRefreshTokenWithSession = Prisma.AdminRefreshTokenGetPayload<{
  include: { session: true };
}>;

export const ADMIN_REFRESH_TOKEN_OUTCOME = {
  VALID: 'VALID',

  REUSED: 'REUSED',

  EXPIRED: 'EXPIRED',

  UNKNOWN: 'UNKNOWN',
} as const;

export type AdminRefreshTokenOutcome =
  (typeof ADMIN_REFRESH_TOKEN_OUTCOME)[keyof typeof ADMIN_REFRESH_TOKEN_OUTCOME];

/** `UNKNOWN` is the one outcome with no row behind it; every other carries the token it found. */
export type AdminRefreshTokenVerification =
  | {
      readonly outcome: Exclude<
        AdminRefreshTokenOutcome,
        typeof ADMIN_REFRESH_TOKEN_OUTCOME.UNKNOWN
      >;
      readonly token: AdminRefreshTokenWithSession;
    }
  | { readonly outcome: typeof ADMIN_REFRESH_TOKEN_OUTCOME.UNKNOWN };
