import { Inject, Injectable, Optional } from '@nestjs/common';

import {
  JwtVerifierService,
  TokenExpiredError,
  type AccessTokenPayload,
} from '#/core/jwt/index.js';

import { AUTH_FAILURE_REASON } from '../constants/auth.constants.js';
import type { AuthenticationResult, RequestAuthenticator } from '../interfaces/index.js';
import { AdminSessionValidator } from '../ports/index.js';

@Injectable()
export class AdminAuthenticator implements RequestAuthenticator {
  constructor(
    private readonly jwtVerifier: JwtVerifierService,
    @Optional()
    @Inject(AdminSessionValidator)
    private readonly sessionValidator: AdminSessionValidator | undefined,
  ) {}

  async authenticate(token: string, deviceId: string): Promise<AuthenticationResult> {
    if (this.sessionValidator === undefined) {
      return { ok: false, reason: AUTH_FAILURE_REASON.SESSION_VALIDATOR_MISSING };
    }

    let payload: AccessTokenPayload;

    try {
      payload = await this.jwtVerifier.verifyAdminAccessToken(token);
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
        subject: { adminId: payload.sub, sessionId: payload.sid },
      };
    }

    return {
      ok: true,
      identity: { adminId: result.session.adminId, sessionId: result.session.id },
    };
  }
}
