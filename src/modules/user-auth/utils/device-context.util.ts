import { DevicePlatform, DeviceType } from '@prisma/client';

import type { RequestContext } from '#/core/context/index.js';

import { DEVICE_FIELD_MAX_LENGTH } from '../constants/index.js';
import type { DeclaredDevice, DeviceContext, ParsedUserAgent } from '../interfaces/index.js';

import { parseUserAgent } from './user-agent.util.js';

const NATIVE_OS_NAME = {
  [DevicePlatform.IOS]: 'iOS',
  [DevicePlatform.ANDROID]: 'Android',
} as const;

export function resolveDeviceContext(
  deviceId: string,
  platform: DevicePlatform,
  declared: DeclaredDevice | undefined,
  context: Readonly<RequestContext> | undefined,
): DeviceContext {
  const parsed = parseUserAgent(context?.userAgent, context?.clientHints);

  const device =
    platform === DevicePlatform.WEB
      ? resolveWebDevice(parsed)
      : resolveNativeDevice(platform, parsed, declared);

  return {
    deviceId,
    platform,
    ...device,
    ...(context?.userAgent !== undefined ? { userAgent: context.userAgent } : {}),
    ...(context?.ip !== undefined ? { ipAddress: context.ip } : {}),
    ...(context?.geo?.countryCode !== undefined ? { countryCode: context.geo.countryCode } : {}),
    ...(context?.geo?.region !== undefined ? { region: context.geo.region } : {}),
    ...(context?.geo?.city !== undefined ? { city: context.geo.city } : {}),
  };
}

function resolveWebDevice(parsed: ParsedUserAgent): Partial<DeviceContext> {
  const deviceName = buildWebDeviceName(parsed);

  return {
    ...(deviceName !== undefined ? { deviceName } : {}),
    ...(parsed.deviceType !== undefined ? { deviceType: parsed.deviceType } : {}),
    ...(parsed.browserName !== undefined ? { browserName: parsed.browserName } : {}),
    ...(parsed.browserVersion !== undefined ? { browserVersion: parsed.browserVersion } : {}),
    ...(parsed.osName !== undefined ? { osName: parsed.osName } : {}),
    ...(parsed.osVersion !== undefined ? { osVersion: parsed.osVersion } : {}),
  };
}

function resolveNativeDevice(
  platform: Exclude<DevicePlatform, typeof DevicePlatform.WEB>,
  parsed: ParsedUserAgent,
  declared: DeclaredDevice | undefined,
): Partial<DeviceContext> {
  const deviceName = clip(declared?.name, DEVICE_FIELD_MAX_LENGTH.NAME) ?? parsed.model;

  const osVersion =
    clip(declared?.osVersion, DEVICE_FIELD_MAX_LENGTH.OS_VERSION) ?? parsed.osVersion;

  const deviceType = declared?.type ?? parsed.deviceType ?? DeviceType.MOBILE;

  return {
    osName: NATIVE_OS_NAME[platform],
    deviceType,
    ...(deviceName !== undefined ? { deviceName } : {}),
    ...(osVersion !== undefined ? { osVersion } : {}),
  };
}

function buildWebDeviceName(parsed: ParsedUserAgent): string | undefined {
  const { browserName, osName } = parsed;

  if (browserName !== undefined && osName !== undefined) {
    return clip(`${browserName} on ${osName}`, DEVICE_FIELD_MAX_LENGTH.NAME);
  }

  return browserName ?? osName;
}

function clip(value: string | undefined, maxLength: number): string | undefined {
  const trimmed = value?.trim();

  if (trimmed === undefined || trimmed.length === 0) {
    return undefined;
  }

  return trimmed.slice(0, maxLength);
}
