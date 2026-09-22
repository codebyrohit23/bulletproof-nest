import type { IncomingMessage } from 'node:http';
import type { Http2ServerRequest } from 'node:http2';

import { uuidv7 } from 'uuidv7';

import { REQUEST_ID_HEADER } from '#/shared/constants/index.js';

import { readHeader, sanitizeIdentifier } from './context.util.js';

export function resolveRequestId(request: IncomingMessage | Http2ServerRequest): string {
  const supplied = sanitizeIdentifier(readHeader(request.headers, REQUEST_ID_HEADER));

  if (supplied !== undefined) {
    return supplied;
  }

  const generated = uuidv7();

  request.headers[REQUEST_ID_HEADER] = generated;

  return generated;
}
