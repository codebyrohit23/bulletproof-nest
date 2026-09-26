import type { Prisma, SessionRevokeReason } from '@prisma/client';

import type { OffsetPaginationQuery } from '#/shared/pagination/index.js';

import type { AdminSessionListStatus } from '../constants/index.js';

export type AdminSessionPageQuery = OffsetPaginationQuery & {
  readonly status: AdminSessionListStatus;
};

/** One session, live or ended, as the "your devices" list needs it. */
export interface AdminSessionSummaryRow {
  readonly id: string;

  readonly deviceName: string | null;

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

export interface AdminSessionRevocation {
  readonly wasCurrent: boolean;
}

export interface AdminDeviceContext {
  readonly deviceId: string;

  readonly userAgent?: string;

  readonly ipAddress?: string;

  readonly countryCode?: string;

  readonly region?: string;

  readonly city?: string;
}

export type AdminSessionDeviceColumns = Pick<
  Prisma.AdminSessionUncheckedCreateInput,
  keyof AdminDeviceContext
>;

export interface CreateAdminSessionInput {
  readonly adminId: string;

  readonly device: AdminDeviceContext;
}

export interface AdminSessionSnapshot {
  readonly id: string;

  readonly adminId: string;

  readonly deviceId: string | null;

  readonly expiresAtMs: number;

  readonly revokedAtMs: number | null;

  readonly lastActivityAtMs: number | null;
}
