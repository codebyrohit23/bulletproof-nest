import type { Environment } from '#/config/app/app.constants.js';
import type { LogFormat, LogLevel } from '#/core/logger/logger.constants.js';

export interface AppConfig {
  readonly env: Environment;

  readonly name: string;

  readonly host: string;

  readonly port: number;

  readonly logLevel: LogLevel;

  readonly logFormat: LogFormat;

  readonly docsEnabled: boolean;

  readonly requestTimeoutMs: number;
}
