import { Injectable } from '@nestjs/common';

import {
  JWT_AUDIENCE,
  JwtVerifierService,
  TokenExpiredError,
  type AccessTokenPayload,
} from '#/core/jwt/index.js';

import { AUTH_FAILURE_REASON } from '../constants/index.js';
import type { AuthenticationResult, RequestAuthenticator } from '../interfaces/index.js';
import { UserSessionValidator } from '../ports/index.js';

@Injectable()
export class UserAuthenticator implements RequestAuthenticator {
  constructor(
    private readonly jwtVerifier: JwtVerifierService,
    private readonly sessionValidator: UserSessionValidator,
  ) {}

  async authenticate(token: string, deviceId: string): Promise<AuthenticationResult> {
    let payload: AccessTokenPayload;

    try {
      payload = await this.jwtVerifier.verifyAccessToken(token, JWT_AUDIENCE.USER);
    } catch (error) {
      return {
        ok: false,
        reason:
          error instanceof TokenExpiredError
            ? AUTH_FAILURE_REASON.TOKEN_EXPIRED
            : AUTH_FAILURE_REASON.TOKEN_INVALID,
      };
    }

    const result = await this.sessionValidator.validate(payload.sid, deviceId);

    if (!result.ok) {
      return {
        ok: false,
        reason: result.reason,
        subject: { userId: payload.sub, sessionId: payload.sid },
      };
    }

    return { ok: true, identity: { userId: result.session.userId, sessionId: result.session.id } };
  }
}
