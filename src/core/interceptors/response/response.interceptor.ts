import { Readable } from 'node:stream';

import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { RequestContextService } from '#/core/context/index.js'; // value import — required for DI metadata

import { NO_CONTENT_STATUS_CODE, RAW_RESPONSE_KEY, RESPONSE_MESSAGE_KEY } from './response.constants.js';
import { SuccessResponseBuilder } from './success-response.builder.js'; // value import — required for DI metadata

/**
 * Wraps every successful handler return value in the API envelope.
 *
 * It has exactly one job: put the payload in `data` and attach `meta`. It does
 * **not** reshape the payload — no unwrapping, no key renaming, no pagination
 * detection. What a controller returns is what a client receives.
 *
 * That matters because reshaping here would mean the response format depends on
 * a payload heuristic, and a handler returning a legitimate object that happens
 * to look like something else would be silently rewritten. A controller that
 * wants `{ items, pagination }` returns exactly that.
 *
 * Deliberately does nothing on the error path: errors are already shaped by
 * `GlobalExceptionFilter`, and an interceptor competing with it would produce
 * two different error formats.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,

    private readonly builder: SuccessResponseBuilder,

    private readonly requestContext: RequestContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http' || this.isOptedOut(context)) {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<FastifyRequest>();
    const response = http.getResponse<FastifyReply>();

    const message = this.reflector.getAllAndOverride<string | undefined>(RESPONSE_MESSAGE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    return next.handle().pipe(
      map((payload: unknown) => {
        if (this.isUnwrappable(payload, response.statusCode)) {
          return payload;
        }

        const { requestId } = this.requestContext;

        return this.builder.build({
          data: payload,
          statusCode: response.statusCode,
          path: request.url,
          ...(message !== undefined ? { message } : {}),
          ...(requestId !== undefined ? { requestId } : {}),
        });
      }),
    );
  }

  private isOptedOut(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean | undefined>(RAW_RESPONSE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) === true
    );
  }

  /**
   * Bodies that must reach the client untouched.
   *
   * `@RawResponse()` is the explicit opt-out, but these are checked anyway:
   * a forgotten decorator on a file download would otherwise serialise a
   * stream into `{"data":{}}` and silently return a broken file.
   *
   * `204` is not a preference — a body on a No Content response violates the
   * HTTP spec and some proxies reject it.
   */
  private isUnwrappable(payload: unknown, statusCode: number): boolean {
    if (statusCode === NO_CONTENT_STATUS_CODE) {
      return true;
    }

    return (
      payload instanceof StreamableFile ||
      payload instanceof Readable ||
      Buffer.isBuffer(payload) ||
      payload === undefined
    );
  }
}
