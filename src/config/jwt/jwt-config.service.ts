import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // value import — required for DI metadata

import type { JwtConfig } from './jwt.interface.js';

@Injectable()
export class JwtConfigService {
  private readonly jwt: JwtConfig;

  constructor(config: ConfigService) {
    this.jwt = config.getOrThrow<JwtConfig>('jwt');
  }

  get privateKey(): string {
    return this.jwt.privateKey;
  }

  get publicKey(): string {
    return this.jwt.publicKey;
  }

  get previousPublicKey(): JwtConfig['previousPublicKey'] {
    return this.jwt.previousPublicKey;
  }

  get issuer(): string {
    return this.jwt.issuer;
  }
}
