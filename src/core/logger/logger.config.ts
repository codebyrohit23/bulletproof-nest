import type { AppConfigService } from '#/config/app/index.js';
import { CORRELATION_ID_HEADER, REQUEST_ID_HEADER } from '#/core/context/index.js';

import type { LoggerConfig } from './interfaces/index.js';
import { LOG_FORMAT, LOGGER_REDACT_PATHS, LOGGER_SERVICE_NAME } from './logger.constants.js';

/**
 * Reads the environment once and hands `logger.factory.ts` a plain object.
 *
 * The split is deliberate: this function is the only place that knows about
 * `AppConfigService`, and the factory is the only place that knows about pino.
 * Neither has to be stubbed to test the other.
 */
export function createLoggerConfig(appConfigService: AppConfigService): LoggerConfig {
  return {
    level: appConfigService.logLevel,

    redact: [...LOGGER_REDACT_PATHS],

    requestIdHeader: REQUEST_ID_HEADER,

    correlationIdHeader: CORRELATION_ID_HEADER,

    serviceName: LOGGER_SERVICE_NAME,

    environment: appConfigService.env,

    /*
     * Driven by `LOG_FORMAT`, not by `NODE_ENV`. Tailing a staging or
     * production pod during an incident is exactly when readable output is
     * worth most, and that is precisely when an environment-derived rule used
     * to force raw JSON.
     */
    pretty: appConfigService.logFormat === LOG_FORMAT.PRETTY,
  };
}
