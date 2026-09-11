import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { LOGGER_CONTEXT } from './constants/index.js';
import type { LogContext } from './interfaces/index.js';
import { normalizeError } from './normalizers/index.js';

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
