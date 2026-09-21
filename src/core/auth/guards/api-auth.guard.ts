import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';

import { RequestContextService, type RequestIdentityPatch } from '#/core/context/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import { API_AUDIENCE, type ApiAudienceKey } from '#/shared/constants/index.js';
import { resolveApiAudience } from '#/shared/utils/index.js';

import { AdminAuthenticator, UserAuthenticator } from '../authenticators/index.js';
import {
  AUTH_ERROR_MESSAGE,
  AUTH_FAILURE_REASON,
  AUTH_LOG_CONTEXT,
  AUTH_PUBLIC_METADATA,
  AUTH_WIRING_FAULTS,
  BEARER_SCHEME,
  type AuthFailureReason,
} from '../constants/index.js';
import type { RequestAuthenticator } from '../interfaces/index.js';

@Injectable()
export class ApiAuthGuard implements CanActivate {
  private readonly authenticators: Record<ApiAudienceKey, RequestAuthenticator>;

  constructor(
    userAuthenticator: UserAuthenticator,
    adminAuthenticator: AdminAuthenticator,
    private readonly requestContext: RequestContextService,
    private readonly logger: AppLoggerService,
    private readonly reflector: Reflector,
  ) {
    this.authenticators = {
      [API_AUDIENCE.USER]: userAuthenticator,
      [API_AUDIENCE.ADMIN]: adminAuthenticator,
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const routePath = request.routeOptions.url;

    if (routePath === undefined) {
      this.refuse(AUTH_FAILURE_REASON.ROUTE_UNRESOLVED);
    }

    const audience = resolveApiAudience(routePath);
    const token = this.readBearerToken(request);

    if (token === undefined) {
      this.refuse(AUTH_FAILURE_REASON.TOKEN_MISSING, audience);
    }

    const deviceId = this.requestContext.deviceId;

    if (deviceId === undefined) {
      this.refuse(AUTH_FAILURE_REASON.DEVICE_ID_MISSING, audience);
    }

    const result = await this.authenticators[audience].authenticate(token, deviceId);

    if (!result.ok) {
      this.refuse(result.reason, audience, result.subject);
    }

    this.requestContext.setIdentity(result.identity);

    return true;
  }

  private isPublic(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(AUTH_PUBLIC_METADATA, [
        context.getHandler(),
        context.getClass(),
      ]) === true
    );
  }

  private readBearerToken(request: FastifyRequest): string | undefined {
    const header = request.headers.authorization;

    if (header === undefined) {
      return undefined;
    }

    const [scheme, token, ...rest] = header.split(' ');

    if (scheme !== BEARER_SCHEME || token === undefined || token.length === 0) {
      return undefined;
    }

    return rest.length === 0 ? token : undefined;
  }

  private refuse(
    reason: AuthFailureReason,
    audience?: ApiAudienceKey,
    subject?: RequestIdentityPatch,
  ): never {
    const entry = {
      context: AUTH_LOG_CONTEXT,
      operation: 'canActivate',
      metadata: {
        reason,
        ...(audience !== undefined ? { audience } : {}),
        ...Object.fromEntries(
          Object.entries(subject ?? {}).filter(([, value]) => value !== undefined),
        ),
      },
    };

    if (AUTH_WIRING_FAULTS.has(reason)) {
      this.logger.error(
        new Error(`Authentication is mis-wired: ${reason}`),
        'Refused a request this service could not authenticate',
        entry,
      );
    } else {
      this.logger.warn('Rejected an authenticated request', entry);
    }

    throw new UnauthorizedException(AUTH_ERROR_MESSAGE.UNAUTHORIZED);
  }
}
