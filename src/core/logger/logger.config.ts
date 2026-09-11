import type { AppConfigService } from '#/config/app/index.js';
import { CORRELATION_ID_HEADER, REQUEST_ID_HEADER } from '#/core/context/index.js';

import { LOG_FORMAT, LOGGER_REDACT_PATHS, LOGGER_SERVICE_NAME } from './constants/index.js';
import type { LoggerConfig } from './interfaces/index.js';

export function createLoggerConfig(appConfigService: AppConfigService): LoggerConfig {
  return {
    level: appConfigService.logLevel,

    redact: [...LOGGER_REDACT_PATHS],

    requestIdHeader: REQUEST_ID_HEADER,

    correlationIdHeader: CORRELATION_ID_HEADER,

    serviceName: LOGGER_SERVICE_NAME,

    environment: appConfigService.env,

    pretty: appConfigService.logFormat === LOG_FORMAT.PRETTY,
  };
}
