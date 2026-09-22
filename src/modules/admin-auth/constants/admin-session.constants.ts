import type { Prisma } from '@prisma/client';

export const ADMIN_SESSION_SNAPSHOT_SELECT = {
  id: true,
  adminId: true,
  deviceId: true,
  expiresAt: true,
  revokedAt: true,
  lastActivityAt: true,
} as const satisfies Prisma.AdminSessionSelect;
