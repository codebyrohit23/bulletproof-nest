import type { CookieSerializeOptions } from '@fastify/cookie';
import { Injectable } from '@nestjs/common';
import type { FastifyReply } from 'fastify';

import { SecurityConfigService } from '#/config/security/index.js';

import { ADMIN_REFRESH_TOKEN_COOKIE } from '../constants/index.js';

@Injectable()
export class AdminTokenDeliveryService {
  constructor(private readonly securityConfig: SecurityConfigService) {}

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
