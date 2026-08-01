import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { SecurityConfig } from './security.interface.js';

@Injectable()
export class SecurityConfigService {
  private readonly app: SecurityConfig;

  constructor(config: ConfigService) {
    this.app = config.getOrThrow<SecurityConfig>('security');
  }

  get cookie() {
    return this.app.cookie;
  }

  get cors() {
    return this.app.cors;
  }

  get rateLimit() {
    return this.app.rateLimit;
  }

  get csrf() {
    return this.app.csrf;
  }
}
