import type { UserSession } from '../dto/index.js';
import type { SessionSnapshot, SessionSummaryRow } from '../interfaces/index.js';

export function toUserSession(row: SessionSummaryRow, currentSessionId: string): UserSession {
  return {
    id: row.id,
    current: row.id === currentSessionId,
    deviceName: row.deviceName,
    deviceType: row.deviceType,
    platform: row.platform,
    browserName: row.browserName,
    browserVersion: row.browserVersion,
    osName: row.osName,
    osVersion: row.osVersion,
    city: row.city,
    region: row.region,
    countryCode: row.countryCode,
    lastActiveAt: row.lastActivityAt?.toISOString() ?? null,
    signedInAt: row.createdAt.toISOString(),
  };
}

export function toSessionSnapshot(session: {
  id: string;
  userId: string;
  deviceId: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  lastActivityAt: Date | null;
}): SessionSnapshot {
  return {
    id: session.id,
    userId: session.userId,
    deviceId: session.deviceId,
    expiresAtMs: session.expiresAt.getTime(),
    revokedAtMs: session.revokedAt?.getTime() ?? null,
    lastActivityAtMs: session?.lastActivityAt?.getTime() ?? null,
  };
}
