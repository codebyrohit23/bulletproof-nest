import { AppLoggerService } from '#/core/logger/index.js';
import {
  JobHandler,
  QUEUE,
  ScheduledJob,
  type JobHandlerContract,
} from '#/infrastructure/queue/index.js';

import { FILE_JOB, FILE_SCHEDULE } from '../constants/index.js';
import { FilePurgeService } from '../services/index.js';
import { logPurgeRun } from '../utils/index.js';

@JobHandler(FILE_JOB.PURGE_DELETED)
@ScheduledJob({ queue: QUEUE.DEFAULT, pattern: FILE_SCHEDULE.PURGE_DELETED })
export class PurgeDeletedFilesJob implements JobHandlerContract<Record<string, never>> {
  constructor(
    private readonly purge: FilePurgeService,

    private readonly logger: AppLoggerService,
  ) {}

  async handle(): Promise<void> {
    const summary = await this.purge.purgeAllReleased(new Date());

    logPurgeRun(this.logger, FILE_JOB.PURGE_DELETED, summary);
  }
}
