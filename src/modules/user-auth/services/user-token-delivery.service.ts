import type { CookieSerializeOptions } from '@fastify/cookie';
import { Injectable } from '@nestjs/common';
import { DevicePlatform } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { SecurityConfigService } from '#/config/security/index.js';

import {
  USER_REFRESH_TOKEN_COOKIE,
  USER_TOKEN_DELIVERY,
  type UserTokenDelivery,
} from '../constants/index.js';
import { UserRefreshSessionDto, type UserAuthResult, type UserAuthTokens } from '../dto/index.js';
import type { PresentedRefreshToken } from '../interfaces/index.js';

@Injectable()
export class UserTokenDeliveryService {
  constructor(private readonly securityConfig: SecurityConfigService) {}

  resolve(platform: DevicePlatform): UserTokenDelivery {
    return platform === DevicePlatform.WEB ? USER_TOKEN_DELIVERY.COOKIE : USER_TOKEN_DELIVERY.BODY;
  }

  read(request: FastifyRequest): PresentedRefreshToken | null {
    const cookie = request.cookies[USER_REFRESH_TOKEN_COOKIE.NAME];

    if (cookie !== undefined && cookie.length > 0) {
      return { token: cookie, delivery: USER_TOKEN_DELIVERY.COOKIE };
    }

    const body = UserRefreshSessionDto.schema.parse(request.body ?? {});

    if (body.refreshToken !== undefined) {
      return { token: body.refreshToken, delivery: USER_TOKEN_DELIVERY.BODY };
    }

    return null;
  }

  applyToAuthResult(
    result: UserAuthResult,
    delivery: UserTokenDelivery,
    reply: FastifyReply,
  ): UserAuthResult {
    if (result.tokens === null) {
      return result;
    }

    return { ...result, tokens: this.applyToTokens(result.tokens, delivery, reply) };
  }

  applyToTokens(
    tokens: UserAuthTokens,
    delivery: UserTokenDelivery,
    reply: FastifyReply,
  ): UserAuthTokens {
    if (delivery === USER_TOKEN_DELIVERY.BODY || tokens.refreshToken === undefined) {
      return tokens;
    }

    reply.setCookie(USER_REFRESH_TOKEN_COOKIE.NAME, tokens.refreshToken, {
      ...this.options(),
      maxAge: USER_REFRESH_TOKEN_COOKIE.MAX_AGE_SECONDS,
    });

    return { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn };
  }

  clear(reply: FastifyReply): void {
    reply.clearCookie(USER_REFRESH_TOKEN_COOKIE.NAME, this.options());
  }

  private options(): CookieSerializeOptions {
    return {
      httpOnly: true,
      secure: this.securityConfig.cookie.secure,
      sameSite: this.securityConfig.cookie.sameSite,
      path: USER_REFRESH_TOKEN_COOKIE.PATH,
    };
  }
}
