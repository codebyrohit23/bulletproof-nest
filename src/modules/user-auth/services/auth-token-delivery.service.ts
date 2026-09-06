import type { CookieSerializeOptions } from '@fastify/cookie';
import { Injectable } from '@nestjs/common';
import { DevicePlatform } from '@prisma/client';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { SecurityConfigService } from '#/config/security/index.js';

import { REFRESH_TOKEN_COOKIE, TOKEN_DELIVERY, type TokenDelivery } from '../constants/index.js';
import { RefreshTokenDto, type AuthResult, type AuthTokens } from '../dto/index.js';
import type { PresentedRefreshToken } from '../interfaces/index.js';

@Injectable()
export class AuthTokenDeliveryService {
  constructor(private readonly securityConfig: SecurityConfigService) {}

  resolve(platform: DevicePlatform): TokenDelivery {
    return platform === DevicePlatform.WEB ? TOKEN_DELIVERY.COOKIE : TOKEN_DELIVERY.BODY;
  }

  read(request: FastifyRequest): PresentedRefreshToken | null {
    const cookie = request.cookies[REFRESH_TOKEN_COOKIE.NAME];

    if (cookie !== undefined && cookie.length > 0) {
      return { token: cookie, delivery: TOKEN_DELIVERY.COOKIE };
    }

    const body = RefreshTokenDto.schema.parse(request.body ?? {});

    if (body.refreshToken !== undefined) {
      return { token: body.refreshToken, delivery: TOKEN_DELIVERY.BODY };
    }

    return null;
  }

  applyToAuthResult(result: AuthResult, delivery: TokenDelivery, reply: FastifyReply): AuthResult {
    if (result.tokens === null) {
      return result;
    }

    return { ...result, tokens: this.applyToTokens(result.tokens, delivery, reply) };
  }

  applyToTokens(tokens: AuthTokens, delivery: TokenDelivery, reply: FastifyReply): AuthTokens {
    if (delivery === TOKEN_DELIVERY.BODY || tokens.refreshToken === undefined) {
      return tokens;
    }

    reply.setCookie(REFRESH_TOKEN_COOKIE.NAME, tokens.refreshToken, {
      ...this.options(),
      maxAge: REFRESH_TOKEN_COOKIE.MAX_AGE_SECONDS,
    });

    return { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn };
  }

  clear(reply: FastifyReply): void {
    reply.clearCookie(REFRESH_TOKEN_COOKIE.NAME, this.options());
  }

  private options(): CookieSerializeOptions {
    return {
      httpOnly: true,
      secure: this.securityConfig.cookie.secure,
      sameSite: this.securityConfig.cookie.sameSite,
      path: REFRESH_TOKEN_COOKIE.PATH,
    };
  }
}
