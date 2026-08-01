import type { LogLevel } from '../logger.constants.js';

export interface LoggerConfig {
  readonly level: LogLevel;

  readonly redact: readonly string[];

  readonly requestIdHeader: string;

  readonly correlationIdHeader: string;
}
