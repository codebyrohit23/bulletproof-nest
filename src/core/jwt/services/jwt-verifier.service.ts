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
import {
  accessTokenPayloadSchema,
  verificationTokenPayloadSchema,
} from '../schemas/jwt-payload.schema.js';
import type {
  AccessAudience,
  AccessTokenPayload,
  VerificationTokenPayload,
} from '../types/jwt-payload.type.js';

import { KeyStoreService } from './key-store.service.js';

@Injectable()
export class JwtVerifierService {
  constructor(
    private readonly keyStore: KeyStoreService,
    private readonly config: JwtConfigService,
  ) {}

  async verifyAccessToken(token: string, audience: AccessAudience): Promise<AccessTokenPayload> {
    return this.verify(token, audience, accessTokenPayloadSchema);
  }

  async verifyVerificationToken(token: string): Promise<VerificationTokenPayload> {
    return this.verify(token, JWT_AUDIENCE.VERIFICATION, verificationTokenPayloadSchema);
  }

  private async verify<T>(
    token: string,
    audience: string,
    schema: ZodType<T, JWTPayload>,
  ): Promise<T> {
    const key = this.keyStore.getVerificationKey(this.readKid(token));

    if (key === undefined) {
      throw new TokenInvalidError();
    }

    let payload: JWTPayload;

    try {
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
