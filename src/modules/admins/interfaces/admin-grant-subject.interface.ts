import type { AdminStatus } from '@prisma/client';

/** What the permission resolver needs to know about an admin — and nothing else. */
export interface AdminGrantSubject {
  readonly status: AdminStatus;

  readonly isSuperAdmin: boolean;

  readonly roleIds: readonly string[];
}
