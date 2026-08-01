import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ENVIRONMENTS } from '@/config/app/app.constants.js';

import type { AppConfig } from './app.interface.js';

@Injectable()
export class AppConfigService {
  private readonly app: AppConfig;

  constructor(config: ConfigService) {
    this.app = config.getOrThrow<AppConfig>('app');
  }
  get env() {
    return this.app.env;
  }

  get port() {
    return this.app.port;
  }

  get host() {
    return this.app.host;
  }

  get logLevel() {
    return this.app.logLevel;
  }

  get requestTimeoutMs() {
    return this.app.requestTimeoutMs;
  }

  get isDevelopment() {
    return this.app.env === ENVIRONMENTS.DEVELOPMENT;
  }

  get isProduction() {
    return this.app.env === ENVIRONMENTS.PRODUCTION;
  }

  get isTest() {
    return this.app.env === ENVIRONMENTS.TEST;
  }
}
