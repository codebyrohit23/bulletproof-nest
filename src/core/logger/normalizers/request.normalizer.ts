import type { StdSerializedResults } from 'pino-http';

import { LOGGER_USER_AGENT_MAX_LENGTH } from '../constants/index.js';
import type { RequestPayload } from '../interfaces/index.js';
import { extractPath } from '../utils/index.js';

type SerializedRequest = StdSerializedResults['req'];

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
