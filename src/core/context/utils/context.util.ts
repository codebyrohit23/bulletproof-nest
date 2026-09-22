import type { IncomingHttpHeaders } from 'node:http';
import { isIP } from 'node:net';

import {
  CLIENT_HINT_HEADER,
  FORWARDED_FOR_HEADER,
  GEO_CITY_HEADER,
  GEO_COUNTRY_HEADER,
  GEO_REGION_HEADER,
} from '#/shared/constants/index.js';

import {
  DEFAULT_LOCALE,
  GEO_COUNTRY_CODE_LENGTH,
  GEO_NAME_MAX_LENGTH,
  GEO_UNKNOWN_COUNTRY_CODES,
} from '../constants/index.js';
import type { ClientHints, RequestGeo } from '../interfaces/index.js';

export function readHeader(headers: IncomingHttpHeaders, name: string): string | undefined {
  const value = headers[name];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function sanitizeIdentifier(value: string | undefined, maxLength = 128): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0 || trimmed.length > maxLength) {
    return undefined;
  }

  return /^[A-Za-z0-9._:-]+$/.test(trimmed) ? trimmed : undefined;
}

export function resolveClientIp(
  headers: IncomingHttpHeaders,
  remoteAddress: string | undefined,
): string | undefined {
  const forwarded = readHeader(headers, FORWARDED_FOR_HEADER);

  if (forwarded !== undefined) {
    const first = forwarded.split(',')[0]?.trim();

    if (isUsableIp(first)) {
      return first;
    }
  }

  return isUsableIp(remoteAddress) ? remoteAddress : undefined;
}

function isUsableIp(value: string | undefined): value is string {
  return value !== undefined && isIP(value) !== 0;
}

export function resolveGeo(headers: IncomingHttpHeaders): RequestGeo | undefined {
  const countryCode = sanitizeCountryCode(readHeader(headers, GEO_COUNTRY_HEADER));
  const region = sanitizePlaceName(readHeader(headers, GEO_REGION_HEADER));
  const city = sanitizePlaceName(readHeader(headers, GEO_CITY_HEADER));

  if (countryCode === undefined && region === undefined && city === undefined) {
    return undefined;
  }

  return {
    ...(countryCode !== undefined ? { countryCode } : {}),
    ...(region !== undefined ? { region } : {}),
    ...(city !== undefined ? { city } : {}),
  };
}

function sanitizeCountryCode(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const code = value.trim().toUpperCase();

  if (code.length !== GEO_COUNTRY_CODE_LENGTH || !/^[A-Z]{2}$/.test(code)) {
    return undefined;
  }

  return GEO_UNKNOWN_COUNTRY_CODES.includes(code) ? undefined : code;
}

function sanitizePlaceName(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const cleaned = value.replaceAll(/[\p{Cc}\p{Cf}]/gu, '').trim();

  if (cleaned.length === 0) {
    return undefined;
  }

  return cleaned.slice(0, GEO_NAME_MAX_LENGTH);
}

export function resolveClientHints(headers: IncomingHttpHeaders): ClientHints | undefined {
  const platform = unquoteHint(readHeader(headers, CLIENT_HINT_HEADER.PLATFORM));
  const platformVersion = unquoteHint(readHeader(headers, CLIENT_HINT_HEADER.PLATFORM_VERSION));
  const model = unquoteHint(readHeader(headers, CLIENT_HINT_HEADER.MODEL));
  const mobile = readBooleanHint(readHeader(headers, CLIENT_HINT_HEADER.MOBILE));

  if (
    platform === undefined &&
    platformVersion === undefined &&
    model === undefined &&
    mobile === undefined
  ) {
    return undefined;
  }

  return {
    ...(platform !== undefined ? { platform } : {}),
    ...(platformVersion !== undefined ? { platformVersion } : {}),
    ...(model !== undefined ? { model } : {}),
    ...(mobile !== undefined ? { mobile } : {}),
  };
}

function unquoteHint(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const unquoted = value
    .trim()
    .replace(/^"(.*)"$/s, '$1')
    .trim();

  if (unquoted.length === 0 || unquoted.length > GEO_NAME_MAX_LENGTH) {
    return undefined;
  }

  return /^[\p{L}\p{N} ._+-]+$/u.test(unquoted) ? unquoted : undefined;
}

function readBooleanHint(value: string | undefined): boolean | undefined {
  const normalized = value?.trim();

  if (normalized === '?1') {
    return true;
  }

  if (normalized === '?0') {
    return false;
  }

  return undefined;
}

const LANGUAGE_TAG_PATTERN = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

export function resolveLocale(header: string | undefined): string {
  if (header === undefined) {
    return DEFAULT_LOCALE;
  }

  const primary = header.split(',')[0]?.split(';')[0]?.trim();

  if (primary === undefined || !LANGUAGE_TAG_PATTERN.test(primary)) {
    return DEFAULT_LOCALE;
  }

  return primary;
}
