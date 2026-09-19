import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';

import { withTimeout } from '#/shared/utils/index.js';

import {
  DISPATCH_TIMEOUT_MS,
  JOB_DEFAULTS,
  QUEUE,
  QUEUE_SETTINGS,
  type QueueName,
} from '../constants/queue.constants.js';
import type { PublishableJob } from '../interfaces/index.js';

@Injectable()
export class JobPublisher {
  private readonly queues: Readonly<Record<QueueName, Queue>>;

  constructor(
    @InjectQueue(QUEUE.EMAIL) email: Queue,
    @InjectQueue(QUEUE.WEBHOOKS) webhooks: Queue,
    @InjectQueue(QUEUE.IMPORTS) imports: Queue,
    @InjectQueue(QUEUE.DEFAULT) fallback: Queue,
  ) {
    this.queues = {
      [QUEUE.EMAIL]: email,
      [QUEUE.WEBHOOKS]: webhooks,
      [QUEUE.IMPORTS]: imports,
      [QUEUE.DEFAULT]: fallback,
    };
  }

  async publish(job: PublishableJob): Promise<void> {
    const settings = QUEUE_SETTINGS[job.queue];

    const added = this.queues[job.queue].add(job.jobName, job.envelope, {
      jobId: job.jobId,

      attempts: job.options.attempts ?? settings.attempts,

      ...(job.options.delayMs !== undefined ? { delay: job.options.delayMs } : {}),
      ...(job.options.priority !== undefined ? { priority: job.options.priority } : {}),

      backoff: {
        type: JOB_DEFAULTS.BACKOFF_TYPE,
        delay: JOB_DEFAULTS.BACKOFF_DELAY_MS,
      },

      removeOnComplete:
        settings.keepCompletedJobs === 0 ? true : { count: settings.keepCompletedJobs },
      removeOnFail: { age: JOB_DEFAULTS.REMOVE_ON_FAIL_AGE_SECONDS },
    });

    await withTimeout(added, DISPATCH_TIMEOUT_MS, `Dispatch of ${job.jobName}`);
  }
}
