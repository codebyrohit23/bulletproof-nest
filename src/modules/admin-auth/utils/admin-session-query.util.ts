import type { Prisma } from '@prisma/client';

import {
  ADMIN_SESSION_HISTORY_WINDOW_MS,
  type AdminSessionListStatus,
} from '../constants/index.js';

export function buildAdminSessionStatusWhere(
  status: AdminSessionListStatus,
  now: Date,
): Prisma.AdminSessionWhereInput {
  const since = new Date(now.getTime() - ADMIN_SESSION_HISTORY_WINDOW_MS);

  const active = {
    revokedAt: null,
    expiresAt: { gt: now },
  } satisfies Prisma.AdminSessionWhereInput;

  const ended = {
    OR: [{ revokedAt: { gte: since } }, { revokedAt: null, expiresAt: { gte: since, lte: now } }],
  } satisfies Prisma.AdminSessionWhereInput;

  const byStatus = {
    active,
    ended,
    all: { OR: [active, ended] },
  } satisfies Record<AdminSessionListStatus, Prisma.AdminSessionWhereInput>;

  return byStatus[status];
}
