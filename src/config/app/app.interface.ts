import type { Environment } from '#/config/app/app.constants.js';
/*
 * Direct import, never the `core/logger` barrel — see the note in
 * `app.schema.ts`. Type-only today, so it erases and cannot cycle on its own,
 * but it is kept on the same path so the two never disagree about where these
 * constants live.
 */
import type { LogFormat, LogLevel } from '#/core/logger/constants/logger.constants.js';

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
