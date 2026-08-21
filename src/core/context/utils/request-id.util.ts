import type { IncomingMessage } from 'node:http';
import type { Http2ServerRequest } from 'node:http2';

import { uuidv7 } from 'uuidv7';

import { REQUEST_ID_HEADER } from '../constants/context.constants.js';

import { readHeader, sanitizeIdentifier } from './context.util.js';

/**
 * Assigns the one id every layer of the request quotes.
 *
 * Three components independently want a request id: Fastify (`request.id`),
 * `pino-http` (`req.id` on every log line), and `RequestContextMiddleware`
 * (`x-request-id` on the response). Left alone they each mint their own, which
 * is how an access log ends up saying `req-1` while the response header says a
 * uuid — two labels for one request, neither able to find the other.
 *
 * This is wired into the Fastify adapter's `genReqId`, which runs before any
 * hook, plugin or middleware. A generated value is written back onto the
 * inbound headers so that everything downstream — all of which reads the
 * header — converges on it instead of generating a second one.
 *
 * A caller-supplied id is honoured after sanitisation: it is how a gateway or
 * a client ties its own trace to ours. `sanitizeIdentifier` is what makes that
 * safe — an unvalidated header would let a caller inject newlines and forge
 * log entries.
 */
export function resolveRequestId(request: IncomingMessage | Http2ServerRequest): string {
  const supplied = sanitizeIdentifier(readHeader(request.headers, REQUEST_ID_HEADER));

  if (supplied !== undefined) {
    return supplied;
  }

  const generated = uuidv7();

  request.headers[REQUEST_ID_HEADER] = generated;

  return generated;
}
