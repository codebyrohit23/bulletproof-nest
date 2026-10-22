import { SetMetadata } from '@nestjs/common';

import type { ScheduledJobOptions } from '../interfaces/scheduled-job.interface.js';

export const SCHEDULED_JOB_METADATA = 'leadflow:scheduled-job';

export function ScheduledJob(options: ScheduledJobOptions): ClassDecorator {
  return SetMetadata(SCHEDULED_JOB_METADATA, options);
}
