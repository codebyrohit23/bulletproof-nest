import type { SessionSnapshot } from '../interfaces/index.js';

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
