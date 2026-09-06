import type { DevicePlatform, DeviceType, Prisma } from '@prisma/client';

export interface DeclaredDevice {
  readonly name?: string | undefined;

  readonly type?: DeviceType | undefined;

  readonly osVersion?: string | undefined;
}

export interface ParsedUserAgent {
  readonly browserName?: string;

  readonly browserVersion?: string;

  readonly osName?: string;

  readonly osVersion?: string;

  readonly deviceType?: DeviceType;

  readonly model?: string;
}

export interface DeviceContext {
  readonly deviceId: string;

  readonly platform: DevicePlatform;

  readonly deviceName?: string;

  readonly deviceType?: DeviceType;

  readonly browserName?: string;

  readonly browserVersion?: string;

  readonly osName?: string;

  readonly osVersion?: string;

  readonly userAgent?: string;

  readonly ipAddress?: string;

  readonly countryCode?: string;

  readonly region?: string;

  readonly city?: string;
}

export type SessionDeviceColumns = Pick<
  Prisma.UserSessionUncheckedCreateInput,
  keyof DeviceContext
>;
