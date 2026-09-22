import { Injectable } from '@nestjs/common';
import type { Prisma, SessionRevokeReason, UserSession } from '@prisma/client';

import { PrismaService, toOffsetArgs } from '#/infrastructure/database/prisma/index.js';
import type { OffsetSlice } from '#/shared/pagination/index.js';

import {
  SESSION_ACTIVITY_THROTTLE_MS,
  SESSION_SUMMARY_SELECT,
  USER_SESSION_TTL_MS,
} from '../constants/index.js';
import type {
  CreateSessionInput,
  SessionDeviceColumns,
  SessionPageQuery,
  SessionSnapshot,
  SessionSummaryRow,
} from '../interfaces/index.js';
import { toSessionSnapshot } from '../mappers/index.js';
import { buildSessionStatusWhere } from '../utils/index.js';

@Injectable()
export class UserSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateSessionInput): Promise<UserSession> {
    const now = new Date();

    const device: SessionDeviceColumns = input.device;

    return this.prisma.db.userSession.create({
      data: {
        userId: input.userId,
        ...device,
        lastActivityAt: now,
        expiresAt: new Date(now.getTime() + USER_SESSION_TTL_MS),
      },
    });
  }

  async findLiveIdByDevice(userId: string, deviceId: string): Promise<string | null> {
    const session = await this.prisma.db.userSession.findFirst({
      where: { userId, deviceId, revokedAt: null },
      select: { id: true },
    });

    return session?.id ?? null;
  }

  async findSnapshotById(id: string): Promise<SessionSnapshot | null> {
    const session = await this.prisma.db.userSession.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        deviceId: true,
        expiresAt: true,
        revokedAt: true,
        lastActivityAt: true,
      },
    });

    return session === null ? null : toSessionSnapshot(session);
  }

  async touchActivity(id: string): Promise<Date | null> {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - SESSION_ACTIVITY_THROTTLE_MS);

    const { count } = await this.prisma.db.userSession.updateMany({
      where: {
        id,
        revokedAt: null,
        OR: [{ lastActivityAt: null }, { lastActivityAt: { lt: staleBefore } }],
      },
      data: { lastActivityAt: now },
    });

    return count > 0 ? now : null;
  }

  async findPageByUser(
    userId: string,
    query: SessionPageQuery,
    now: Date,
  ): Promise<OffsetSlice<SessionSummaryRow>> {
    const where = {
      userId,
      ...buildSessionStatusWhere(query.status, now),
    } satisfies Prisma.UserSessionWhereInput;

    const [total, rows] = await Promise.all([
      this.prisma.db.userSession.count({ where }),
      this.prisma.db.userSession.findMany({
        where,
        select: SESSION_SUMMARY_SELECT,
        ...toOffsetArgs(query, [
          { lastActivityAt: { sort: 'desc', nulls: 'last' } },
          { createdAt: 'desc' },
        ]),
      }),
    ]);

    return { rows, total };
  }

  async revokeOwned(id: string, userId: string, reason: SessionRevokeReason): Promise<boolean> {
    const { count } = await this.prisma.db.userSession.updateMany({
      where: { id, userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });

    return count > 0;
  }

  async revoke(id: string, reason: SessionRevokeReason): Promise<boolean> {
    const { count } = await this.prisma.db.userSession.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });

    return count > 0;
  }

  async revokeAllForUser(
    userId: string,
    reason: SessionRevokeReason,
    exceptSessionId?: string,
  ): Promise<string[]> {
    const live = await this.prisma.db.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
        ...(exceptSessionId !== undefined ? { id: { not: exceptSessionId } } : {}),
      },
      select: { id: true },
    });

    if (live.length === 0) {
      return [];
    }

    const ids = live.map((session) => session.id);

    await this.prisma.db.userSession.updateMany({
      where: { id: { in: ids }, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });

    return ids;
  }
}
