import type { AdminStatus } from '@prisma/client';

export interface AdminSnapshot {
  readonly id: string;

  readonly email: string;

  readonly firstName: string;

  readonly lastName: string | null;

  readonly displayName: string;

  readonly avatarFileId: string | null;

  readonly status: AdminStatus;

  readonly emailVerifiedAt: Date | null;
}
