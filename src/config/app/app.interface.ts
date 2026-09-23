import type { LogFormat, LogLevel } from '#/shared/constants/index.js';

import type { Environment } from './app.constants.js';

export interface AppConfig {
  readonly env: Environment;

  readonly name: string;

  readonly webUrl: string;

  readonly adminWebAppUrl: string;

  readonly host: string;

  readonly port: number;

  readonly logLevel: LogLevel;

  readonly logFormat: LogFormat;

  readonly docsEnabled: boolean;

  readonly requestTimeoutMs: number;
}
