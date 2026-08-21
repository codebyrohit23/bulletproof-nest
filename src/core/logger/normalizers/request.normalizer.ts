import type { StdSerializedResults } from 'pino-http';

import type { RequestPayload } from '../interfaces/request-payload.interface.js';
import { LOGGER_USER_AGENT_MAX_LENGTH } from '../logger.constants.js';
import { extractPath } from '../utils/index.js';

/**
 * A custom `req` serializer does not receive the request.
 *
 * `pino-http` wraps it with `wrapRequestSerializer`, so pino's standard
 * serializer runs first and this receives its output. That is a feature rather
 * than an obstacle: the standard serializer is what knows how to reach through
 * Fastify's wrapper, hapi's `req.info` and Express's `originalUrl` to find the
 * method, url and client address, and none of that has to be repeated here.
 */
type SerializedRequest = StdSerializedResults['req'];

/**
 * Cuts pino's standard request payload down to what is actually read.
 *
 * Dropped: `id` (emitted top level as `requestId` instead, so one search term
 * matches every line about the request), `query` and `params` (both carry
 * tokens and PII in positions no redact path can name), every header, and
 * `remotePort` — an ephemeral TCP port that identifies nothing.
 */
export function normalizeRequest(request: SerializedRequest): RequestPayload {
  const payload: RequestPayload = {
    method: request.method,
    path: extractPath(request.url),
  };

  if (request.remoteAddress !== undefined && request.remoteAddress !== '') {
    payload.ip = request.remoteAddress;
  }

  const userAgent = request.headers['user-agent'];

  if (userAgent !== undefined) {
    payload.userAgent = userAgent.slice(0, LOGGER_USER_AGENT_MAX_LENGTH);
  }

  return payload;
}
