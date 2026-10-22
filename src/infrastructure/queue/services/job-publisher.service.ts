import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';

import { withTimeout } from '#/shared/utils/index.js';

import { DISPATCH_TIMEOUT_MS, QUEUE, type QueueName } from '../constants/queue.constants.js';
import type { JobEnvelope, PublishableJob, ScheduledJobDefinition } from '../interfaces/index.js';
import { queueJobOptions } from '../utils/job-options.util.js';

@Injectable()
export class JobPublisher {
  private readonly queues: Readonly<Record<QueueName, Queue>>;

  constructor(
    @InjectQueue(QUEUE.EMAIL) email: Queue,
    @InjectQueue(QUEUE.WEBHOOKS) webhooks: Queue,
    @InjectQueue(QUEUE.IMPORTS) imports: Queue,
    @InjectQueue(QUEUE.MEDIA) media: Queue,
    @InjectQueue(QUEUE.DEFAULT) fallback: Queue,
  ) {
    this.queues = {
      [QUEUE.EMAIL]: email,
      [QUEUE.WEBHOOKS]: webhooks,
      [QUEUE.IMPORTS]: imports,
      [QUEUE.MEDIA]: media,
      [QUEUE.DEFAULT]: fallback,
    };
  }

  async publish(job: PublishableJob): Promise<void> {
    const defaults = queueJobOptions(job.queue);

    const added = this.queues[job.queue].add(job.jobName, job.envelope, {
      ...defaults,

      jobId: job.jobId,

      attempts: job.options.attempts ?? defaults.attempts,

      ...(job.options.delayMs !== undefined ? { delay: job.options.delayMs } : {}),
      ...(job.options.priority !== undefined ? { priority: job.options.priority } : {}),
    });

    await withTimeout(added, DISPATCH_TIMEOUT_MS, `Dispatch of ${job.jobName}`);
  }

  async upsertSchedule(
    schedule: ScheduledJobDefinition,
    envelope: JobEnvelope<Record<string, never>>,
  ): Promise<void> {
    await this.queues[schedule.queue].upsertJobScheduler(
      schedule.jobName,
      { pattern: schedule.pattern, tz: 'UTC' },
      { name: schedule.jobName, data: envelope, opts: queueJobOptions(schedule.queue) },
    );
  }

  async scheduleIds(queue: QueueName): Promise<string[]> {
    const schedulers = await this.queues[queue].getJobSchedulers();

    return schedulers.map((scheduler) => scheduler.id ?? scheduler.key);
  }

  async removeSchedule(queue: QueueName, jobName: string): Promise<void> {
    await this.queues[queue].removeJobScheduler(jobName);
  }
}
