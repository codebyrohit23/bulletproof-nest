import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import type { LogContext } from './interfaces/logger-context.interface.js';
import { LOGGER_CONTEXT } from './logger.constants.js';
import { normalizeError } from './normalizers/index.js';

/**
 * The application-facing logger.
 *
 * Failures are bound under `err` rather than `error`: it is the key pino's own
 * serializer, `pino-pretty` and every downstream integration look for, and it
 * is the key `pino-http` uses for the automatic request logs. Two names for the
 * same thing would mean two queries to find all of a service's failures.
 *
 * An `Error` is handed over untouched so that pino's serializer — which
 * understands cause chains and aggregate errors — can do the work. Anything
 * else is normalized here, because pino passes non-errors through verbatim and
 * `throw 'boom'` would otherwise reach the log as a bare string.
 *
 * There is no method for a *client's* mistake. A 4xx is not a failure of this
 * service, so it must not populate `err` — the field an error dashboard counts.
 * `GlobalExceptionFilter` logs those at `warn` with the mapped error code
 * instead.
 */
@Injectable()
export class AppLoggerService {
  constructor(
    @InjectPinoLogger(LOGGER_CONTEXT)
    private readonly logger: PinoLogger,
  ) {}

  trace(message: string, bindings?: Partial<LogContext>): void {
    this.logger.trace(bindings ?? {}, message);
  }

  debug(message: string, bindings?: Partial<LogContext>): void {
    this.logger.debug(bindings ?? {}, message);
  }

  info(message: string, bindings?: Partial<LogContext>): void {
    this.logger.info(bindings ?? {}, message);
  }

  warn(message: string, bindings?: Partial<LogContext>): void {
    this.logger.warn(bindings ?? {}, message);
  }

  /** A failure of this service. The only level worth paging on. */
  error(error: unknown, message = 'Unexpected error', bindings?: Partial<LogContext>): void {
    this.logger.error(
      {
        ...bindings,
        err: error instanceof Error ? error : normalizeError(error),
      },
      message,
    );
  }

  fatal(error: unknown, message = 'Fatal error', bindings?: Partial<LogContext>): void {
    this.logger.fatal(
      {
        ...bindings,
        err: error instanceof Error ? error : normalizeError(error),
      },
      message,
    );
  }
}
