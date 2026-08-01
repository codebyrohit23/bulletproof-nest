import type { FastifyRequest } from 'fastify';

import type { RequestPayload } from '../interfaces/request-payload.interface.js';

/**
 * Creates a minimal, safe representation of an incoming HTTP request.
 *
 * This payload is intentionally transport-agnostic and avoids logging
 * sensitive information such as headers, cookies, authorization tokens,
 * or request bodies.
 */
export function normalizeRequest(request: FastifyRequest): RequestPayload {
  const payload: RequestPayload = {
    id: request.id,
    method: request.method,
    url: request.url,
    path: request.routeOptions.url ?? request.url,
    ip: request.ip,
  };

  const userAgent = request.headers['user-agent'];

  if (userAgent !== undefined) {
    payload.userAgent = userAgent;
  }

  return payload;
}
