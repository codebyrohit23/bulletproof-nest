import { type ArgumentsHost, Catch, type ExceptionFilter, Injectable } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { AppLoggerService } from '#/core/logger/index.js';

import { ErrorResponseBuilder } from '../builders/error-response.builder.js';
import { ExceptionMapperService } from '../exception-mapper.service.js';

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

    this.logException(exception, details.statusCode, request);

    const body = this.errorResponseBuilder.build({
      exception: details,
      path: request.url,
    });

    httpAdapter.reply(response, body, details.statusCode);
  }

  private logException(exception: unknown, statusCode: number, request: FastifyRequest): void {
    this.logger.error(exception, 'Unhandled exception', {
      context: GlobalExceptionFilter.name,
      operation: 'catch',

      statusCode,

      metadata: {
        method: request.method,
        path: request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
    });
  }
}
