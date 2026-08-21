import { registerAs } from '@nestjs/config';

import { env } from '../shared/env.js';

import type { AppConfig } from './app.interface.js';

export const appConfig = registerAs('app', (): AppConfig => ({
  env: env.NODE_ENV,

  name: env.APP_NAME,

  host: env.HOST,

  port: env.PORT,

  logLevel: env.LOG_LEVEL,

  logFormat: env.LOG_FORMAT,

  docsEnabled: env.DOCS_ENABLED,

  requestTimeoutMs: env.REQUEST_TIMEOUT_MS,
}));
