import type { AdminSessionSnapshot } from '../interfaces/index.js';

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
