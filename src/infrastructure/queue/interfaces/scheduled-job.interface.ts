import type { QueueName } from '../constants/queue.constants.js';

export interface ScheduledJobOptions {
  readonly queue: QueueName;

  /** A cron pattern, read in UTC — `5 * * * *` is five past every hour. */
  readonly pattern: string;
}

/** One schedule as the registry syncs it: the job's name with its options. */
export interface ScheduledJobDefinition extends ScheduledJobOptions {
  readonly jobName: string;
}
