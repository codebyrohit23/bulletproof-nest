import type { LogLevel } from '../logger.constants.js';

/**
 * The logger's settings, resolved once at startup.
 *
 * Deliberately free of `AppConfigService` and of every pino type: this is the
 * contract between "what the environment says" and "how the transport is
 * built", and keeping it plain is what lets `logger.factory.ts` be a pure
 * function that a test can call without a Nest container.
 */
export interface LoggerConfig {
  readonly level: LogLevel;

  readonly redact: readonly string[];

  readonly requestIdHeader: string;

  readonly correlationIdHeader: string;

  /** Emitted on every line, so one log index can serve the whole fleet. */
  readonly serviceName: string;

  /**
   * Which deployment produced the line. Without it a staging incident and a
   * production incident are indistinguishable in a shared index.
   */
  readonly environment: string;

  /**
   * Human-readable, colourised output for a terminal.
   *
   * Off everywhere but local development: `pino-pretty` costs a transport
   * worker and produces text no log aggregator can parse back into fields.
   */
  readonly pretty: boolean;
}
