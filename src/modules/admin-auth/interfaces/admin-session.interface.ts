import type { Prisma } from '@prisma/client';

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
