import type { UserStatus } from '@prisma/client';

export interface UserSnapshot {
  readonly id: string;

  readonly firstName: string;

  readonly lastName: string | null;

  readonly displayName: string;

  readonly avatarFileId: string | null;

  readonly status: UserStatus;
}
