import type { IdentifierType, UserState } from '@prisma/client';

export interface UserIdentityWithUser {
  readonly id: string;

  readonly userId: string;

  readonly user: {
    readonly state: UserState;
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
    readonly state: UserState;

    readonly credential: {
      readonly passwordHash: string;
      readonly passwordChangedAt: Date;
    } | null;
  };
}
