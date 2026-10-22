import { JOB_DEFAULTS, QUEUE_SETTINGS, type QueueName } from '../constants/queue.constants.js';
import type { QueueJobOptions } from '../interfaces/index.js';

export function queueJobOptions(queue: QueueName): QueueJobOptions {
  const settings = QUEUE_SETTINGS[queue];

  return {
    attempts: settings.attempts,

    backoff: {
      type: JOB_DEFAULTS.BACKOFF_TYPE,
      delay: JOB_DEFAULTS.BACKOFF_DELAY_MS,
    },

    removeOnComplete:
      settings.keepCompletedJobs === 0 ? true : { count: settings.keepCompletedJobs },

    removeOnFail: { age: JOB_DEFAULTS.REMOVE_ON_FAIL_AGE_SECONDS },
  };
}
