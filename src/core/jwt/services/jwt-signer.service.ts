import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { SignJWT } from 'jose';

import { JwtConfigService } from '#/config/jwt/index.js';

import {
  JWT_ALGORITHM,
  JWT_AUDIENCE,
  JWT_TOKEN_TYPE,
  TOKEN_TTL_SECONDS,
} from '../constants/jwt.constants.js';
import type { AccessTokenClaims } from '../types/jwt-payload.type.js';

import { KeyStoreService } from './key-store.service.js';

@Injectable()
export class JwtSignerService {
  constructor(
    private readonly keyStore: KeyStoreService,
    private readonly config: JwtConfigService,
  ) {}

  async signAccessToken(claims: AccessTokenClaims): Promise<string> {
    return this.sign({ ...claims, typ: JWT_TOKEN_TYPE.ACCESS }, TOKEN_TTL_SECONDS.ACCESS);
  }

  private async sign(payload: Record<string, unknown>, ttlSeconds: number): Promise<string> {
    return new SignJWT(payload)
      .setProtectedHeader({ alg: JWT_ALGORITHM, kid: this.keyStore.signingKid })
      .setIssuer(this.config.issuer)
      .setAudience(JWT_AUDIENCE)
      .setJti(randomUUID())
      .setIssuedAt()
      .setExpirationTime(`${ttlSeconds}s`)
      .sign(this.keyStore.signingKey);
  }
}
