import type { DeviceContext } from './device-context.interface.js';

export interface CreateSessionInput {
  readonly userId: string;

  readonly device: DeviceContext;
}

export interface SessionSnapshot {
  readonly id: string;

  readonly userId: string;

  readonly deviceId: string | null;

  readonly expiresAtMs: number;

  readonly revokedAtMs: number | null;

  readonly lastActivityAtMs: number | null;
}
