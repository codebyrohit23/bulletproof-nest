import type { AdminStatus } from '@prisma/client';

/**
 * What the permission resolver needs to know about an admin from `admins`.
 * Which roles the admin holds is `modules/admin-roles`' — it owns the
 * assignments and their cache.
 */
export interface AdminGrantSubject {
  readonly status: AdminStatus;

  readonly isSuperAdmin: boolean;
}
