import type { IncomingMessage, ServerResponse } from 'node:http';

import { Injectable, type NestMiddleware } from '@nestjs/common';
import { uuidv7 } from 'uuidv7';

import {
  CLIENT_ID_HEADER,
  CORRELATION_ID_HEADER,
  LOCALE_HEADER,
  REQUEST_ID_HEADER,
  RESPONSE_REQUEST_ID_HEADER,
  TIMEZONE_HEADER,
  USER_AGENT_HEADER,
} from '../constants/context.constants.js';
import type { RequestContext } from '../interfaces/index.js';
import { RequestContextService } from '../services/request-context.service.js'; // value import — required for DI metadata
import {
  readHeader,
  resolveClientIp,
  resolveLocale,
  sanitizeIdentifier,
} from '../utils/context.util.js';

/**
 * Establishes the request context for every inbound request.
 *
 * **Middleware, not an interceptor.** Nest runs
 * `middleware → guards → interceptors → pipes → handler`. An interceptor-based
 * context would not exist yet when a guard rejects an unauthenticated request,
 * so the resulting 401 and its log line would carry no `requestId` — precisely
 * the case where you need one.
 *
 * Under Fastify, Nest middleware receives the raw Node request rather than a
 * `FastifyRequest`, so the address is read from the socket instead of
 * `request.ip`.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContext: RequestContextService) {}

  use(request: IncomingMessage, response: ServerResponse, next: (error?: unknown) => void): void {
    const context = this.buildContext(request);

    /*
     * Echoed before the handler runs so the id reaches the client even on an
     * error path, where the response is produced by the exception filter.
     */
    response.setHeader(RESPONSE_REQUEST_ID_HEADER, context.requestId);

    this.requestContext.run(context, () => {
      next();
    });
  }

  private buildContext(request: IncomingMessage): RequestContext {
    const { headers } = request;

    const requestId = sanitizeIdentifier(readHeader(headers, REQUEST_ID_HEADER)) ?? uuidv7();

    /*
     * A correlation id ties several services together for one user action.
     * When the caller supplies none this request is the origin, so the two ids
     * are the same — which keeps every downstream log queryable by one value.
     */
    const correlationId =
      sanitizeIdentifier(readHeader(headers, CORRELATION_ID_HEADER)) ?? requestId;

    const ip = resolveClientIp(headers, request.socket.remoteAddress);
    const userAgent = readHeader(headers, USER_AGENT_HEADER);
    const timezone = sanitizeIdentifier(readHeader(headers, TIMEZONE_HEADER), 64);
    const clientId = sanitizeIdentifier(readHeader(headers, CLIENT_ID_HEADER));

    return {
      requestId,
      correlationId,
      locale: resolveLocale(readHeader(headers, LOCALE_HEADER)),
      ...(ip !== undefined ? { ip } : {}),
      ...(userAgent !== undefined ? { userAgent } : {}),
      ...(timezone !== undefined ? { timezone } : {}),
      ...(clientId !== undefined ? { clientId } : {}),
    };
  }
}
