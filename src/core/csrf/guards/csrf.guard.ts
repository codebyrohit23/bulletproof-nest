import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';

import { SecurityConfigService } from '#/config/security/index.js'; // value import — required for DI metadata
import { AppLoggerService } from '#/core/logger/index.js'; // value import — required for DI metadata

import {
  CSRF_ERROR_MESSAGE,
  CSRF_FAILURE_REASON,
  CSRF_LOG_CONTEXT,
  CSRF_SAFE_METHODS,
  CSRF_SKIP_METADATA,
  FETCH_SITE,
  FETCH_SITE_HEADER,
  ORIGIN_HEADER,
  WILDCARD_ORIGIN,
  HTTP_CONTEXT,
  type CsrfFailureReason,
} from '../constants/index.js';

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,

    private readonly security: SecurityConfigService,

    private readonly logger: AppLoggerService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.security.csrf.enabled || context.getType() !== HTTP_CONTEXT) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();

    if (CSRF_SAFE_METHODS.has(request.method) || this.isSkipped(context)) {
      return true;
    }

    const fetchSite = this.header(request, FETCH_SITE_HEADER);
    const origin = this.header(request, ORIGIN_HEADER);

    if (fetchSite === FETCH_SITE.CROSS_SITE) {
      this.refuse(CSRF_FAILURE_REASON.CROSS_SITE, request, { fetchSite, origin });
    }

    if (origin !== undefined && !this.isTrustedOrigin(origin)) {
      this.refuse(CSRF_FAILURE_REASON.UNTRUSTED_ORIGIN, request, { fetchSite, origin });
    }

    return true;
  }

  private isSkipped(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(CSRF_SKIP_METADATA, [
        context.getHandler(),
        context.getClass(),
      ]) === true
    );
  }

  private isTrustedOrigin(origin: string): boolean {
    const allowed = this.security.cors.origin;

    return allowed.includes(WILDCARD_ORIGIN) || allowed.includes(origin);
  }

  private header(request: FastifyRequest, name: string): string | undefined {
    const value = request.headers[name];

    return Array.isArray(value) ? value[0] : value;
  }

  private refuse(
    reason: CsrfFailureReason,
    request: FastifyRequest,
    headers: { fetchSite: string | undefined; origin: string | undefined },
  ): never {
    this.logger.warn('Rejected a cross-site request', {
      context: CSRF_LOG_CONTEXT,
      operation: 'canActivate',
      metadata: {
        reason,
        method: request.method,
        path: request.url,
        ...(headers.fetchSite !== undefined ? { fetchSite: headers.fetchSite } : {}),
        ...(headers.origin !== undefined ? { origin: headers.origin } : {}),
      },
    });

    throw new ForbiddenException(CSRF_ERROR_MESSAGE.FORBIDDEN);
  }
}
