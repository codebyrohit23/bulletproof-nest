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
} from '../constants/context.constants.js';
import type { ClientHints, RequestGeo } from '../interfaces/index.js';

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
 *
 * ---------------------------------------------------------------------------
 * WHY THE RESULT IS VALIDATED AND NOT JUST TRIMMED
 * ---------------------------------------------------------------------------
 * `x-forwarded-for` is a string, and plenty of things put non-addresses in it.
 * Squid writes a literal `unknown` when it cannot determine the client. Some
 * CDNs and load balancers write `Forwarded`-style tokens. And a client talking
 * to this service directly can write whatever it likes.
 *
 * That matters because this value is stored in `user_sessions.ip_address`,
 * which is Postgres `inet` — a type that *rejects* text it cannot parse. An
 * unvalidated value therefore does not degrade the record, it fails the insert,
 * and since the only thing inserting a session is login, it fails the login:
 * the password verifies, and then the request dies with `P2007` and a generic
 * "Data validation failed". One `unknown` from a newly introduced proxy is
 * enough to break sign-in for every user at once.
 *
 * So an address that is not an address is treated as no address at all. The
 * column is nullable, an unknown origin is an honest thing to record, and no
 * caller is entitled to fail because of it.
 *
 * A rejected forwarded value falls through to the socket address rather than
 * returning nothing: it is at least a real address, and behind a proxy it
 * identifies the hop, which beats recording silence.
 */
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

/**
 * A parseable IPv4 or IPv6 address.
 *
 * `isIP` answers `4`, `6`, or `0` for neither, so anything non-zero is storable
 * in an `inet` column. IPv4-mapped IPv6 — `::ffff:127.0.0.1`, which is what
 * Node hands back for an IPv4 client on a dual-stack socket — reports as `6`
 * and is accepted by Postgres unchanged.
 */
function isUsableIp(value: string | undefined): value is string {
  return value !== undefined && isIP(value) !== 0;
}

/**
 * Where the edge says the request originated.
 *
 * Returns `undefined` — not an empty object — when the edge supplied nothing,
 * so a caller can tell "no proxy in front of us" from "proxy that knows the
 * country but not the city".
 *
 * `XX` and `T1` are dropped rather than stored: they are Cloudflare's way of
 * saying *unknown* and *arrived over Tor*, and neither is a country. Recording
 * them would put a value in `country_code` that a session list would render as
 * a place, which is worse than rendering nothing.
 *
 * Never call this on a request that did not cross a trusted proxy. These
 * headers are plain strings, and the only thing making them true is that the
 * edge overwrites whatever the client sent.
 */
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

/**
 * Place names are free text, so this cleans rather than validates.
 *
 * `sanitizeIdentifier` would reject most of the planet — its allowlist has no
 * room for `São Paulo`, `Île-de-France` or `東京都`. What actually has to go is
 * anything that could forge a log line, and anything longer than the column.
 * Over-length is truncated rather than dropped: a clipped city name is still
 * useful to a user reviewing their sessions, whereas a clipped device id would
 * be a different device.
 */
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

/**
 * The User-Agent Client Hints this origin asked for.
 *
 * Returns `undefined` when none arrived, which is the common case: a
 * non-Chromium browser, a first request that has not yet seen `Accept-CH`, a
 * cross-origin page that did not delegate them, or any native client. Callers
 * must have a UA-string path regardless — this only ever improves an answer,
 * it never provides one on its own.
 *
 * Hint values are RFC 8941 structured-field strings, meaning they arrive
 * wrapped in double quotes (`"Windows"`), and booleans arrive as `?1` / `?0`.
 * Unwrapping happens here so nothing downstream has to know that.
 */
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

/**
 * Strips the structured-field quoting and rejects anything implausible.
 *
 * The length cap is generous but present: these land in `VarChar(100)` columns
 * after a couple of hops, and an unbounded header is an unbounded log line
 * either way.
 */
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

/**
 * `?1` is true, `?0` is false, anything else is no answer at all.
 *
 * The three-way return matters: `Sec-CH-UA-Mobile: ?0` is a browser positively
 * stating it is not a phone, which is worth more than the absence of the
 * header, and collapsing both to `false` would throw that distinction away.
 */
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
