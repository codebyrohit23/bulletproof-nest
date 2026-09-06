import { Injectable } from '@nestjs/common';
import type { SessionRevokeReason, UserSession } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

import { SESSION_ACTIVITY_THROTTLE_MS, USER_SESSION_TTL_MS } from '../constants/index.js';
import type {
  CreateSessionInput,
  SessionDeviceColumns,
  SessionSnapshot,
} from '../interfaces/index.js';
import { toSessionSnapshot } from '../utils/session.util.js';

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

  async revoke(id: string, reason: SessionRevokeReason): Promise<boolean> {
    const { count } = await this.prisma.db.userSession.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });

    return count > 0;
  }

  /**
   * Retires every live session a user holds, optionally sparing one.
   *
   * `exceptSessionId` is for a caller who is *inside* one of these sessions and
   * has just re-proven itself — changing a password from the settings screen.
   * Signing that device out buys nothing, since it would sign straight back in
   * with the password it just chose, and the sessions worth taking away are the
   * other ones.
   */
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
