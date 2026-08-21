import type { StdSerializedResults } from 'pino-http';

import type { ResponsePayload } from '../interfaces/response-payload.interface.js';

/**
 * As with the request serializer, `pino-http` runs pino's standard `res`
 * serializer first and hands this its output — `{ statusCode, headers }`.
 */
type SerializedResponse = StdSerializedResults['res'];

/**
 * Keeps the status code and discards the headers.
 *
 * On this service that is roughly twenty fields — the Helmet security headers,
 * the CORS headers, the CSP string — byte-identical on every single response.
 * Recording them per request is a constant multiplied by traffic.
 */
export function normalizeResponse(response: SerializedResponse): ResponsePayload {
  return {
    statusCode: response.statusCode,
  };
}
