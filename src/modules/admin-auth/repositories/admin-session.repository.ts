import { Injectable } from '@nestjs/common';
import type { AdminSession, SessionRevokeReason } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

import {
  ADMIN_SESSION_ACTIVITY_THROTTLE_MS,
  ADMIN_SESSION_SNAPSHOT_SELECT,
  ADMIN_SESSION_TTL_MS,
} from '../constants/index.js';
import type {
  AdminSessionSnapshot,
  CreateAdminSessionInput,
  AdminSessionDeviceColumns,
} from '../interfaces/index.js';
import { toAdminSessionSnapshot } from '../mappers/index.js';

@Injectable()
export class AdminSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAdminSessionInput): Promise<AdminSession> {
    const now = new Date();

    const device: AdminSessionDeviceColumns = input.device;

    return this.prisma.db.adminSession.create({
      data: {
        adminId: input.adminId,
        ...device,
        lastActivityAt: now,
        expiresAt: new Date(now.getTime() + ADMIN_SESSION_TTL_MS),
      },
    });
  }

  async findLiveIdByDevice(adminId: string, deviceId: string): Promise<string | null> {
    const session = await this.prisma.db.adminSession.findFirst({
      where: { adminId, deviceId, revokedAt: null },
      select: { id: true },
    });

    return session?.id ?? null;
  }

  async findSnapshotById(id: string): Promise<AdminSessionSnapshot | null> {
    const session = await this.prisma.db.adminSession.findUnique({
      where: { id },
      select: ADMIN_SESSION_SNAPSHOT_SELECT,
    });

    return session === null ? null : toAdminSessionSnapshot(session);
  }

  async touchActivity(id: string): Promise<Date | null> {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - ADMIN_SESSION_ACTIVITY_THROTTLE_MS);

    const { count } = await this.prisma.db.adminSession.updateMany({
      where: {
        id,
        revokedAt: null,
        OR: [{ lastActivityAt: null }, { lastActivityAt: { lt: staleBefore } }],
      },
      data: { lastActivityAt: now },
    });

    return count > 0 ? now : null;
  }

  async revokeAllForAdmin(
    adminId: string,
    reason: SessionRevokeReason,
    exceptSessionId?: string,
  ): Promise<string[]> {
    const revoked = await this.prisma.db.adminSession.updateManyAndReturn({
      where: {
        adminId,
        revokedAt: null,
        ...(exceptSessionId !== undefined ? { id: { not: exceptSessionId } } : {}),
      },
      data: { revokedAt: new Date(), revokedReason: reason },
      select: { id: true },
    });

    return revoked.map((session) => session.id);
  }

  async revoke(id: string, reason: SessionRevokeReason): Promise<boolean> {
    const { count } = await this.prisma.db.adminSession.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    });

    return count > 0;
  }
}
