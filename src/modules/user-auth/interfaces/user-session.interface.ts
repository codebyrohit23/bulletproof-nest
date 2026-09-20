import type { DevicePlatform, DeviceType } from '@prisma/client';

import type { DeviceContext } from './device-context.interface.js';

/** One live session as the "your devices" list needs it. */
export interface SessionSummaryRow {
  readonly id: string;

  readonly deviceName: string | null;

  readonly deviceType: DeviceType | null;

  readonly platform: DevicePlatform | null;

  readonly browserName: string | null;

  readonly browserVersion: string | null;

  readonly osName: string | null;

  readonly osVersion: string | null;

  readonly city: string | null;

  readonly region: string | null;

  readonly countryCode: string | null;

  readonly lastActivityAt: Date | null;

  readonly createdAt: Date;
}

export interface SessionRevocation {
  readonly wasCurrent: boolean;
}

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
