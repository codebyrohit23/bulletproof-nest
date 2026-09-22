import type { Prisma } from '@prisma/client';

export const LAST_ACTIVE_THROTTLE_MS = 5 * 60 * 1000;

export const USERS_LOG_CONTEXT = 'Users';

export const USER_SNAPSHOT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  displayName: true,
  avatarFileId: true,
  status: true,
} as const satisfies Prisma.UserSelect;
