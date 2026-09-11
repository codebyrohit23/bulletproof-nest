import type { FastifyCorsOptions } from '@fastify/cors';

/*
 * Imported from the constants files directly, never from the `core/*` barrels.
 * Those barrels export modules and services, and this file is read while the
 * Fastify adapter is being configured — before the DI container exists. Both
 * constants files import nothing, so this direction stays acyclic.
 */
import {
  CORRELATION_ID_HEADER,
  DEVICE_ID_HEADER,
  REQUEST_ID_HEADER,
  RESPONSE_REQUEST_ID_HEADER,
  TIMEZONE_HEADER,
  WORKSPACE_ID_HEADER,
} from '#/core/context/constants/context.constants.js';
import { RATE_LIMIT_HEADER } from '#/core/rate-limit/constants/rate-limit.constants.js';

/**
 * How long a browser may cache a preflight result.
 *
 * Every authenticated request this API serves carries `X-Device-Id`, which is
 * not a safelisted header — so without this, each one costs two round trips
 * instead of one. Ten minutes is the ceiling Chrome honours; larger values are
 * silently clamped rather than rejected.
 */
const PREFLIGHT_MAX_AGE_SECONDS = 600;

/**
 * Request headers a browser client may send.
 *
 * **Not cosmetic.** A header missing from this list is rejected at preflight and
 * the request never reaches the application. Omitting `X-Device-Id` does not
 * weaken device binding — it breaks every authenticated browser request
 * outright, because `UserAuthGuard` refuses a request that arrives without one.
 *
 * The names come from the constants the request-context middleware reads, so
 * adding a header there and forgetting it here cannot happen silently.
 *
 * Deliberately absent:
 *
 * - `Accept-Language` — CORS-safelisted, so listing it changes nothing. The
 *   browser sends it on its own, which is the whole reason the locale is read
 *   from it rather than from a custom `X-Locale`.
 * - `Sec-CH-UA-*` client hints — set by the user agent, never by page script,
 *   so they are not subject to preflight. Listing them would imply script can
 *   send them.
 * - `X-Forwarded-For` — set by the proxy. A browser sending one is spoofing,
 *   and `trustProxy` decides whether it is believed.
 * - `Content-Type` is listed despite being safelisted, because it is only
 *   safelisted for three media types and `application/json` is not one.
 */
const ALLOWED_REQUEST_HEADERS = [
  'Content-Type',
  'Authorization',

  /** Required on every authenticated request — the session is bound to it. */
  DEVICE_ID_HEADER,

  /**
   * Which workspace the caller is acting in. Nothing reads it yet; permitted
   * now so that landing the workspace guard is not also a CORS change and a
   * redeploy. It is a hint the guard must verify against membership, never a
   * claim to be trusted.
   */
  WORKSPACE_ID_HEADER,

  TIMEZONE_HEADER,

  /**
   * Both are optional — the middleware generates a request id when none
   * arrives, and falls back to it for the correlation id. They are permitted so
   * a client that keeps its own logs can stitch them to this service's:
   * a mobile app sends its own request id, and one correlation id across a
   * multi-call flow makes that whole flow one query here.
   */
  REQUEST_ID_HEADER,
  CORRELATION_ID_HEADER,
];

/**
 * Response headers a browser client may read.
 *
 * Anything not listed is invisible to `fetch`, however faithfully the server
 * sets it — which is the failure mode worth naming, because the header is
 * present on the wire and absent in the client, so it looks like a server bug.
 *
 * `x-request-id` is the one a support conversation depends on: it is echoed on
 * every response including errors, and a client that cannot read it cannot
 * quote it back. The `RateLimit-*` trio lets a client slow down deliberately
 * instead of retrying into a 429, and `Retry-After` accompanies the refusal.
 */
const EXPOSED_RESPONSE_HEADERS = [
  RESPONSE_REQUEST_ID_HEADER,

  RATE_LIMIT_HEADER.LIMIT,
  RATE_LIMIT_HEADER.REMAINING,
  RATE_LIMIT_HEADER.RESET,
  'retry-after',

  /** File downloads — the filename lives here, not in the body. */
  'content-disposition',
];

export const DEFAULT_CORS_OPTIONS: Pick<
  FastifyCorsOptions,
  'methods' | 'allowedHeaders' | 'exposedHeaders' | 'maxAge'
> = {
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

  allowedHeaders: ALLOWED_REQUEST_HEADERS,

  exposedHeaders: EXPOSED_RESPONSE_HEADERS,

  maxAge: PREFLIGHT_MAX_AGE_SECONDS,
};
