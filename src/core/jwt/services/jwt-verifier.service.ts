import { Injectable } from '@nestjs/common';
import { type JWTPayload, decodeProtectedHeader, errors, jwtVerify } from 'jose';
import type { ZodType } from 'zod';

import { JwtConfigService } from '#/config/jwt/index.js';

import {
  JWT_ALGORITHM,
  JWT_AUDIENCE,
  JWT_CLOCK_TOLERANCE_SECONDS,
} from '../constants/jwt.constants.js';
import { TokenExpiredError, TokenInvalidError } from '../errors/jwt.errors.js';
import { accessTokenPayloadSchema } from '../schemas/jwt-payload.schema.js';
import type { AccessTokenPayload } from '../types/jwt-payload.type.js';

import { KeyStoreService } from './key-store.service.js';

@Injectable()
export class JwtVerifierService {
  constructor(
    private readonly keyStore: KeyStoreService,
    private readonly config: JwtConfigService,
  ) {}

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.verify(token, accessTokenPayloadSchema, JWT_AUDIENCE.USER);
  }

  /**
   * The payload has the same shape as a user token's, but `sub` is an admin id
   * and `sid` an `admin_sessions` id. Only `AdminSessionValidator` should be
   * given either.
   */
  async verifyAdminAccessToken(token: string): Promise<AccessTokenPayload> {
    return this.verify(token, accessTokenPayloadSchema, JWT_AUDIENCE.ADMIN);
  }

  private async verify<T>(
    token: string,
    schema: ZodType<T, JWTPayload>,
    audience: string,
  ): Promise<T> {
    const key = this.keyStore.getVerificationKey(this.readKid(token));

    if (key === undefined) {
      throw new TokenInvalidError();
    }

    let payload: JWTPayload;

    try {
      /*
       * `audience` is enforced here, by jose, before the payload is parsed —
       * a token issued for the other audience never reaches the schema below.
       */
      ({ payload } = await jwtVerify(token, key, {
        algorithms: [JWT_ALGORITHM],
        issuer: this.config.issuer,
        audience,
        clockTolerance: JWT_CLOCK_TOLERANCE_SECONDS,
      }));
    } catch (error) {
      if (error instanceof errors.JWTExpired) {
        throw new TokenExpiredError({ cause: error });
      }

      throw new TokenInvalidError(undefined, { cause: error });
    }

    const result = schema.safeParse(payload);

    if (!result.success) {
      throw new TokenInvalidError(undefined, { cause: result.error });
    }

    return result.data;
  }

  private readKid(token: string): string {
    let kid: string | undefined;

    try {
      ({ kid } = decodeProtectedHeader(token));
    } catch (error) {
      throw new TokenInvalidError(undefined, { cause: error });
    }

    if (kid === undefined) {
      throw new TokenInvalidError();
    }

    return kid;
  }
}
