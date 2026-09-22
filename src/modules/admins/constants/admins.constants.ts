import type { Prisma } from '@prisma/client';

export const ADMINS_LOG_CONTEXT = 'Admins';

export const ADMIN_SNAPSHOT_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  displayName: true,
  status: true,
  emailVerifiedAt: true,
} as const satisfies Prisma.AdminSelect;

export const ADMIN_BOOTSTRAP_LOCK_KEY = 7_2026_09_22;
