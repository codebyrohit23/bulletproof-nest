import type { IncomingHttpHeaders } from 'node:http';

import { DEFAULT_LOCALE, FORWARDED_FOR_HEADER } from '../constants/context.constants.js';

/**
 * Pure helpers for turning raw headers into context values.
 * No DI, no framework types, no logging.
 */

/** Node collapses repeated headers into an array; take the first value. */
export function readHeader(headers: IncomingHttpHeaders, name: string): string | undefined {
  const value = headers[name];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

/**
 * Client-supplied identifiers end up in log lines, so they cannot be trusted
 * verbatim — a header containing newlines can forge log entries, and an
 * unbounded one can flood the log pipeline.
 *
 * Returns `undefined` when the value is unusable, so the caller generates one.
 */
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

/**
 * Resolves the caller's address, preferring the proxy header.
 *
 * Only meaningful behind a trusted proxy — `x-forwarded-for` is client-writable
 * when the app is exposed directly, so never use this for authorisation.
 */
export function resolveClientIp(
  headers: IncomingHttpHeaders,
  remoteAddress: string | undefined,
): string | undefined {
  const forwarded = readHeader(headers, FORWARDED_FOR_HEADER);

  if (forwarded !== undefined) {
    const first = forwarded.split(',')[0]?.trim();

    if (first !== undefined && first.length > 0) {
      return first;
    }
  }

  return remoteAddress;
}

/**
 * A BCP 47 language tag: `en`, `en-GB`, `zh-Hant-TW`.
 */
const LANGUAGE_TAG_PATTERN = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

/**
 * Takes the highest-priority language tag from an `Accept-Language` header.
 *
 * Quality values are ignored — clients already send tags in preference order.
 * Anything that is not a well-formed tag falls back to the default, which
 * matters because the wildcard `*` is extremely common (it is what `fetch`
 * sends by default) and is not a locale.
 */
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
