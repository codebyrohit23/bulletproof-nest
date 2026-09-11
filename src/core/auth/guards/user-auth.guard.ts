import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';

import { RequestContextService } from '#/core/context/index.js';
import { JwtVerifierService, TokenExpiredError } from '#/core/jwt/index.js';
import { AppLoggerService } from '#/core/logger/index.js';

import {
  AUTH_ERROR_MESSAGE,
  AUTH_FAILURE_REASON,
  AUTH_LOG_CONTEXT,
  AUTH_PUBLIC_METADATA,
  BEARER_SCHEME,
  type AuthFailureReason,
} from '../constants/auth.constants.js';
import { SessionValidator } from '../ports/session-validator.port.js';

@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private readonly jwtVerifier: JwtVerifierService,
    private readonly sessionValidator: SessionValidator,
    private readonly requestContext: RequestContextService,
    private readonly logger: AppLoggerService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isPublic(context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.readBearerToken(request);

    if (token === undefined) {
      this.refuse(AUTH_FAILURE_REASON.TOKEN_MISSING);
    }

    const payload = await this.verify(token);
    const deviceId = this.requestContext.deviceId;

    if (deviceId === undefined) {
      this.refuse(AUTH_FAILURE_REASON.DEVICE_ID_MISSING, {
        userId: payload.sub,
        sessionId: payload.sid,
      });
    }

    const result = await this.sessionValidator.validate(payload.sid, deviceId);

    if (!result.ok) {
      this.refuse(result.reason, { userId: payload.sub, sessionId: payload.sid });
    }

    this.requestContext.setIdentity({
      userId: result.session.userId,
      sessionId: result.session.id,
    });

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

  private async verify(token: string) {
    try {
      return await this.jwtVerifier.verifyAccessToken(token);
    } catch (error) {
      this.refuse(
        error instanceof TokenExpiredError
          ? AUTH_FAILURE_REASON.TOKEN_EXPIRED
          : AUTH_FAILURE_REASON.TOKEN_INVALID,
      );
    }
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
    identity?: { userId?: string; sessionId?: string },
  ): never {
    this.logger.warn('Rejected an authenticated request', {
      context: AUTH_LOG_CONTEXT,
      operation: 'canActivate',
      metadata: {
        reason,
        ...(identity?.userId !== undefined ? { userId: identity.userId } : {}),
        ...(identity?.sessionId !== undefined ? { sessionId: identity.sessionId } : {}),
      },
    });

    throw new UnauthorizedException(AUTH_ERROR_MESSAGE.UNAUTHORIZED);
  }
}
