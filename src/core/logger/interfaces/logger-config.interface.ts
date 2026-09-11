import type { LogLevel } from '../constants/index.js';

export interface LoggerConfig {
  readonly level: LogLevel;

  readonly redact: readonly string[];

  readonly requestIdHeader: string;

  readonly correlationIdHeader: string;

  readonly serviceName: string;

  readonly environment: string;

  readonly pretty: boolean;
}
