import type { AppConfigService } from '#/config/app/index.js';
import { CORRELATION_ID_HEADER, REQUEST_ID_HEADER } from '#/core/context/index.js';

import type { LoggerConfig } from './interfaces/index.js';
import { LOGGER_REDACT_PATHS } from './logger.constants.js';

export function createLoggerConfig(appConfigService: AppConfigService): LoggerConfig {
  return {
    level: appConfigService.logLevel,

    redact: [...LOGGER_REDACT_PATHS],

    requestIdHeader: REQUEST_ID_HEADER,

    correlationIdHeader: CORRELATION_ID_HEADER,
  };
}
