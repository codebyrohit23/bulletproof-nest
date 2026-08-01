import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import type { LogContext } from './interfaces/logger-context.interface.js';
import { LOGGER_CONTEXT } from './logger.constants.js';
import { normalizeError } from './normalizers/error.normalizer.js';

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

  error(error: unknown, message = 'Unexpected error', bindings?: Partial<LogContext>): void {
    this.logger.error(
      {
        ...bindings,
        error: normalizeError(error),
      },
      message,
    );
  }

  fatal(error: unknown, message = 'Fatal error', bindings?: Partial<LogContext>): void {
    this.logger.fatal(
      {
        ...bindings,
        error: normalizeError(error),
      },
      message,
    );
  }
}
