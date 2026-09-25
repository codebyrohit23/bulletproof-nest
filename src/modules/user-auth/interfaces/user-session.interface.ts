import type { DevicePlatform, DeviceType, SessionRevokeReason } from '@prisma/client';

import type { OffsetPaginationQuery } from '#/shared/pagination/index.js';

import type { UserSessionListStatus } from '../constants/index.js';

import type { DeviceContext } from './device-context.interface.js';

export type SessionPageQuery = OffsetPaginationQuery & { readonly status: UserSessionListStatus };

/** One session, live or ended, as the "your devices" list needs it. */
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

  readonly expiresAt: Date;

  readonly revokedAt: Date | null;

  readonly revokedReason: SessionRevokeReason | null;
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
