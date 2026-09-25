import type { Prisma } from '@prisma/client';

import { USER_SESSION_HISTORY_WINDOW_MS, type UserSessionListStatus } from '../constants/index.js';

export function buildSessionStatusWhere(
  status: UserSessionListStatus,
  now: Date,
): Prisma.UserSessionWhereInput {
  const since = new Date(now.getTime() - USER_SESSION_HISTORY_WINDOW_MS);

  const active = { revokedAt: null, expiresAt: { gt: now } } satisfies Prisma.UserSessionWhereInput;

  const ended = {
    OR: [{ revokedAt: { gte: since } }, { revokedAt: null, expiresAt: { gte: since, lte: now } }],
  } satisfies Prisma.UserSessionWhereInput;

  const byStatus = {
    active,
    ended,
    all: { OR: [active, ended] },
  } satisfies Record<UserSessionListStatus, Prisma.UserSessionWhereInput>;

  return byStatus[status];
}
