import type { AppLoggerService } from '#/core/logger/index.js';

import { FILES_LOG_CONTEXT } from '../constants/index.js';
import type { PurgeRunSummary } from '../interfaces/index.js';

import { describeBytes } from './file-description.util.js';

export function logPurgeRun(
  logger: AppLoggerService,
  jobName: string,
  summary: PurgeRunSummary,
): void {
  const message =
    `Purged ${summary.files} file(s) in ${summary.batches} batch(es), ` +
    `${describeBytes(summary.bytes)} of workspace usage given back`;

  const bindings = { context: FILES_LOG_CONTEXT, operation: jobName, metadata: { ...summary } };

  if (summary.stalled) {
    logger.warn(`${message}; stopped: a batch deleted none of the files it read`, bindings);
  } else if (summary.reachedLimit) {
    logger.warn(`${message}; more are due, the next run continues`, bindings);
  } else {
    logger.info(message, bindings);
  }
}
