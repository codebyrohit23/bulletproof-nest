import type { IncomingMessage, ServerResponse } from 'node:http';

import { Injectable, type NestMiddleware } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';

import {
  CLIENT_ID_HEADER,
  CORRELATION_ID_HEADER,
  DEVICE_ID_HEADER,
  DEVICE_ID_MAX_LENGTH,
  LOCALE_HEADER,
  REQUEST_ID_HEADER,
  RESPONSE_REQUEST_ID_HEADER,
  TIMEZONE_HEADER,
  USER_AGENT_HEADER,
} from '../constants/context.constants.js';
import type { RequestContext } from '../interfaces/index.js';
import { RequestContextService } from '../services/request-context.service.js';
import {
  readHeader,
  resolveClientHints,
  resolveClientIp,
  resolveGeo,
  resolveLocale,
  sanitizeIdentifier,
} from '../utils/context.util.js';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}

  use(request: IncomingMessage, response: ServerResponse, next: (error?: unknown) => void): void {
    const context = this.buildContext(request);

    response.setHeader(RESPONSE_REQUEST_ID_HEADER, context.requestId);

    this.requestContext.run(context, () => {
      next();
    });
  }

  private buildContext(request: IncomingMessage): RequestContext {
    const { headers } = request;

    const requestId = sanitizeIdentifier(readHeader(headers, REQUEST_ID_HEADER)) ?? uuidv7();

    const correlationId =
      sanitizeIdentifier(readHeader(headers, CORRELATION_ID_HEADER)) ?? requestId;

    const ip = resolveClientIp(headers, request.socket.remoteAddress);
    const userAgent = readHeader(headers, USER_AGENT_HEADER);
    const timezone = sanitizeIdentifier(readHeader(headers, TIMEZONE_HEADER), 64);
    const clientId = sanitizeIdentifier(readHeader(headers, CLIENT_ID_HEADER));

    const deviceId = sanitizeIdentifier(
      readHeader(headers, DEVICE_ID_HEADER),
      DEVICE_ID_MAX_LENGTH,
    );

    /*
     * Resolved for every request, not only for login, because both are
     * transport facts about *this* request and the middleware is the one place
     * that reads headers. Sessions are the first consumer; an audit trail and
     * a risk signal are the obvious next two, and neither should have to add a
     * second pass over the same headers to get them.
     */
    const geo = resolveGeo(headers);
    const clientHints = resolveClientHints(headers);

    return {
      requestId,
      correlationId,
      locale: resolveLocale(readHeader(headers, LOCALE_HEADER)),
      ...(ip !== undefined ? { ip } : {}),
      ...(userAgent !== undefined ? { userAgent } : {}),
      ...(timezone !== undefined ? { timezone } : {}),
      ...(clientId !== undefined ? { clientId } : {}),
      ...(deviceId !== undefined ? { deviceId } : {}),
      ...(geo !== undefined ? { geo } : {}),
      ...(clientHints !== undefined ? { clientHints } : {}),
    };
  }
}
