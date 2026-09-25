import {
  USER_SESSION_END_REASON,
  USER_SESSION_END_REASON_BY_REVOKE_REASON,
  USER_SESSION_STATUS,
  type UserSessionEndReason,
  type UserSessionStatus,
} from '../constants/index.js';
import type { UserSession } from '../dto/index.js';
import type { SessionSnapshot, SessionSummaryRow } from '../interfaces/index.js';

interface SessionEnding {
  readonly status: UserSessionStatus;

  readonly endedAt: string | null;

  readonly endReason: UserSessionEndReason | null;
}

function resolveEnding(row: SessionSummaryRow, now: Date): SessionEnding {
  if (row.revokedAt !== null) {
    return {
      status: USER_SESSION_STATUS.ENDED,
      endedAt: row.revokedAt.toISOString(),
      endReason:
        row.revokedReason === null
          ? null
          : USER_SESSION_END_REASON_BY_REVOKE_REASON[row.revokedReason],
    };
  }

  if (row.expiresAt <= now) {
    return {
      status: USER_SESSION_STATUS.ENDED,
      endedAt: row.expiresAt.toISOString(),
      endReason: USER_SESSION_END_REASON.EXPIRED,
    };
  }

  return { status: USER_SESSION_STATUS.ACTIVE, endedAt: null, endReason: null };
}

export function toUserSession(
  row: SessionSummaryRow,
  currentSessionId: string,
  now: Date,
): UserSession {
  return {
    id: row.id,
    current: row.id === currentSessionId,
    ...resolveEnding(row, now),
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
