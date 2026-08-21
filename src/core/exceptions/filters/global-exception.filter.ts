import { type ArgumentsHost, Catch, type ExceptionFilter, Injectable } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppLoggerService } from '#/core/logger/index.js';

import { ErrorResponseBuilder } from '../builders/error-response.builder.js';
import { LOGGED_INVALID_FIELD_LIMIT, SERVER_ERROR_STATUS } from '../constants/index.js';
import { ExceptionMapperService } from '../exception-mapper.service.js';
import type { ExceptionDetails } from '../interfaces/index.js';

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,

    private readonly logger: AppLoggerService,

    private readonly exceptionMapper: ExceptionMapperService,

    private readonly errorResponseBuilder: ErrorResponseBuilder,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;

    const context = host.switchToHttp();
    const request = context.getRequest<FastifyRequest>();

    const response = context.getResponse<FastifyReply>();

    const details = this.exceptionMapper.map(exception);

    this.logException(exception, details);

    const body = this.errorResponseBuilder.build({
      exception: details,
      path: request.url,
    });

    httpAdapter.reply(response, body, details.statusCode);
  }

  /**
   * The method, path, ip and user agent are deliberately absent: `pino-http`'s
   * request serializer already puts them on this line, because `nestjs-pino`
   * binds the logger to the request. Repeating them here doubled the size of
   * every error line and gave two places for them to disagree.
   */
  private logException(exception: unknown, details: ExceptionDetails): void {
    const bindings = {
      context: GlobalExceptionFilter.name,
      operation: 'catch',
      statusCode: details.statusCode,
    };

    if (details.statusCode < SERVER_ERROR_STATUS) {
      this.logClientError(details, bindings);

      return;
    }

    this.logger.error(exception, 'Request failed', bindings);
  }

  /**
   * A 4xx is this filter working as designed — the client is being told it got
   * the request wrong. Logging that at `error`, with a stack trace through the
   * framework's own parser, is what turns the error level into something nobody
   * can alert on.
   *
   * What is recorded is the *mapped* failure rather than the exception: the
   * stable `code` is what a dashboard counts, and it survives a change of
   * exception type. The `err` key is left alone entirely, so a query for this
   * service's failures does not have to filter out its own correct behaviour.
   */
  private logClientError(details: ExceptionDetails, bindings: Record<string, unknown>): void {
    const invalidFields = details.validationErrors
      ?.slice(0, LOGGED_INVALID_FIELD_LIMIT)
      .map(({ field }) => field);

    this.logger.warn('Request rejected', {
      ...bindings,

      metadata: {
        code: details.error.code,
        reason: details.message,

        ...(invalidFields !== undefined && invalidFields.length > 0 ? { invalidFields } : {}),
      },
    });
  }
}
