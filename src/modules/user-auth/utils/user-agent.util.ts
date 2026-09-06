import { DeviceType } from '@prisma/client';
import Bowser from 'bowser';

import type { ClientHints } from '#/core/context/index.js';

import { DEVICE_FIELD_MAX_LENGTH } from '../constants/index.js';
import type { ParsedUserAgent } from '../interfaces/index.js';

export function parseUserAgent(
  userAgent: string | undefined,
  hints: ClientHints | undefined,
): ParsedUserAgent {
  const parsed = parseWithBowser(userAgent);
  const osName = truncate(hints?.platform ?? parsed.osName, DEVICE_FIELD_MAX_LENGTH.OS_NAME);
  const osVersion = truncate(
    hints?.platformVersion ?? parsed.osVersion,
    DEVICE_FIELD_MAX_LENGTH.OS_VERSION,
  );

  const deviceType = resolveDeviceType(parsed.deviceType, hints?.mobile);
  const model = hints?.model ?? parsed.model;

  const browserName = truncate(parsed.browserName, DEVICE_FIELD_MAX_LENGTH.BROWSER_NAME);
  const browserVersion = truncate(parsed.browserVersion, DEVICE_FIELD_MAX_LENGTH.BROWSER_VERSION);

  return {
    ...(browserName !== undefined ? { browserName } : {}),
    ...(browserVersion !== undefined ? { browserVersion } : {}),
    ...(osName !== undefined ? { osName } : {}),
    ...(osVersion !== undefined ? { osVersion } : {}),
    ...(deviceType !== undefined ? { deviceType } : {}),
    ...(model !== undefined ? { model } : {}),
  };
}

function parseWithBowser(userAgent: string | undefined): ParsedUserAgent {
  if (userAgent === undefined || userAgent.trim().length === 0) {
    return {};
  }

  const { browser, os, platform } = Bowser.parse(userAgent);

  const browserName = blankToUndefined(browser.name);
  const browserVersion = blankToUndefined(browser.version);
  const osName = blankToUndefined(os.name);
  const model = blankToUndefined(platform.model);
  const deviceType = mapDeviceType(platform.type);
  const osVersion = blankToUndefined(os.versionName) ?? blankToUndefined(os.version);

  return {
    ...(browserName !== undefined ? { browserName } : {}),
    ...(browserVersion !== undefined ? { browserVersion } : {}),
    ...(osName !== undefined ? { osName } : {}),
    ...(osVersion !== undefined ? { osVersion } : {}),
    ...(deviceType !== undefined ? { deviceType } : {}),
    ...(model !== undefined ? { model } : {}),
  };
}

function mapDeviceType(type: string | undefined): DeviceType | undefined {
  switch (type) {
    case 'desktop': {
      return DeviceType.DESKTOP;
    }

    case 'tablet': {
      return DeviceType.TABLET;
    }

    case 'mobile': {
      return DeviceType.MOBILE;
    }

    case undefined:
    case '': {
      return undefined;
    }

    default: {
      return DeviceType.OTHER;
    }
  }
}

function resolveDeviceType(
  parsed: DeviceType | undefined,
  mobileHint: boolean | undefined,
): DeviceType | undefined {
  if (parsed !== undefined) {
    return parsed;
  }

  if (mobileHint === undefined) {
    return undefined;
  }

  return mobileHint ? DeviceType.MOBILE : DeviceType.DESKTOP;
}

function blankToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();

  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
}

function truncate(value: string | undefined, maxLength: number): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? undefined : trimmed.slice(0, maxLength);
}
