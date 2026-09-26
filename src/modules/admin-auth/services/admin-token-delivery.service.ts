import type { CookieSerializeOptions } from '@fastify/cookie';
import { Injectable } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { SecurityConfigService } from '#/config/security/index.js';

import { ADMIN_REFRESH_TOKEN_COOKIE } from '../constants/index.js';

/**
 * Cookie only. The admin console is web-only, so there is no body delivery as
 * `UserTokenDeliveryService` has for native clients — and a refresh token that
 * never appears in a body is one script on the page cannot read.
 */
@Injectable()
export class AdminTokenDeliveryService {
  constructor(private readonly securityConfig: SecurityConfigService) {}

  read(request: FastifyRequest): string | undefined {
    const cookie = request.cookies[ADMIN_REFRESH_TOKEN_COOKIE.NAME];

    return cookie !== undefined && cookie.length > 0 ? cookie : undefined;
  }

  set(reply: FastifyReply, refreshToken: string): void {
    reply.setCookie(ADMIN_REFRESH_TOKEN_COOKIE.NAME, refreshToken, {
      ...this.options(),
      maxAge: ADMIN_REFRESH_TOKEN_COOKIE.MAX_AGE_SECONDS,
    });
  }

  clear(reply: FastifyReply): void {
    reply.clearCookie(ADMIN_REFRESH_TOKEN_COOKIE.NAME, this.options());
  }

  private options(): CookieSerializeOptions {
    return {
      httpOnly: true,
      secure: this.securityConfig.cookie.secure,
      sameSite: this.securityConfig.cookie.sameSite,
      path: ADMIN_REFRESH_TOKEN_COOKIE.PATH,
    };
  }
}
