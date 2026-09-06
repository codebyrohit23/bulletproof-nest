import type { IdentifierType, UserStatus } from '@prisma/client';

export interface UserIdentityWithUser {
  readonly id: string;

  readonly userId: string;

  readonly verifiedAt: Date | null;
  readonly user: {
    readonly status: UserStatus;
  };
}

export interface UserIdentityWithUserAndCredential {
  readonly id: string;
  readonly userId: string;
  readonly identifierType: IdentifierType;
  readonly identifierValue: string;
  readonly verifiedAt: Date | null;

  readonly user: {
    readonly id: string;
    readonly status: UserStatus;

    readonly credential: {
      readonly passwordHash: string;
      readonly passwordChangedAt: Date;
    } | null;
  };
}
