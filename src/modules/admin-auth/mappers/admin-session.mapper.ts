import {
  ADMIN_SESSION_END_REASON,
  ADMIN_SESSION_END_REASON_BY_REVOKE_REASON,
  ADMIN_SESSION_STATUS,
  type AdminSessionEndReason,
  type AdminSessionStatus,
} from '../constants/index.js';
import type { AdminSession } from '../dto/index.js';
import type { AdminSessionSnapshot, AdminSessionSummaryRow } from '../interfaces/index.js';

export function toAdminSessionSnapshot(session: {
  id: string;
  adminId: string;
  deviceId: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  lastActivityAt: Date | null;
}): AdminSessionSnapshot {
  return {
    id: session.id,
    adminId: session.adminId,
    deviceId: session.deviceId,
    expiresAtMs: session.expiresAt.getTime(),
    revokedAtMs: session.revokedAt?.getTime() ?? null,
    lastActivityAtMs: session.lastActivityAt?.getTime() ?? null,
  };
}

interface AdminSessionEnding {
  readonly status: AdminSessionStatus;

  readonly endedAt: string | null;

  readonly endReason: AdminSessionEndReason | null;
}

function resolveEnding(row: AdminSessionSummaryRow, now: Date): AdminSessionEnding {
  if (row.revokedAt !== null) {
    return {
      status: ADMIN_SESSION_STATUS.ENDED,
      endedAt: row.revokedAt.toISOString(),
      endReason:
        row.revokedReason === null
          ? null
          : ADMIN_SESSION_END_REASON_BY_REVOKE_REASON[row.revokedReason],
    };
  }

  if (row.expiresAt <= now) {
    return {
      status: ADMIN_SESSION_STATUS.ENDED,
      endedAt: row.expiresAt.toISOString(),
      endReason: ADMIN_SESSION_END_REASON.EXPIRED,
    };
  }

  return { status: ADMIN_SESSION_STATUS.ACTIVE, endedAt: null, endReason: null };
}

export function toAdminSession(
  row: AdminSessionSummaryRow,
  currentSessionId: string,
  now: Date,
): AdminSession {
  return {
    id: row.id,
    current: row.id === currentSessionId,
    ...resolveEnding(row, now),
    deviceName: row.deviceName,
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
