import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';

import { QUEUE, QUEUE_SETTINGS } from '../constants/queue.constants.js';
import type { JobEnvelope } from '../interfaces/index.js';
import { JobRunner } from '../services/job-runner.service.js'; // value import — required for DI metadata

/**
 * One worker per queue. Each delegates straight to `JobRunner`, which restores
 * context and dispatches to the handler registered for the job name.
 *
 * **One processor per queue, never one per job.** Two `@Processor('mail')`
 * classes would start two workers on the same queue, both pulling every job and
 * each having to ignore what is not theirs. Dispatch by name inside a single
 * worker is the only correct shape.
 *
 * These classes are the reason `attempts` lives in `QUEUE_SETTINGS`: the
 * decorator's options must be static, so they cannot come from a config
 * service.
 */

@Injectable()
@Processor(QUEUE.MAIL, { concurrency: QUEUE_SETTINGS[QUEUE.MAIL].concurrency })
export class MailQueueProcessor extends WorkerHost {
  constructor(private readonly runner: JobRunner) {
    super();
  }

  async process(job: Job<JobEnvelope<unknown>>): Promise<void> {
    await this.runner.run(QUEUE.MAIL, job);
  }
}

@Injectable()
@Processor(QUEUE.WEBHOOKS, { concurrency: QUEUE_SETTINGS[QUEUE.WEBHOOKS].concurrency })
export class WebhooksQueueProcessor extends WorkerHost {
  constructor(private readonly runner: JobRunner) {
    super();
  }

  async process(job: Job<JobEnvelope<unknown>>): Promise<void> {
    await this.runner.run(QUEUE.WEBHOOKS, job);
  }
}

@Injectable()
@Processor(QUEUE.IMPORTS, { concurrency: QUEUE_SETTINGS[QUEUE.IMPORTS].concurrency })
export class ImportsQueueProcessor extends WorkerHost {
  constructor(private readonly runner: JobRunner) {
    super();
  }

  async process(job: Job<JobEnvelope<unknown>>): Promise<void> {
    await this.runner.run(QUEUE.IMPORTS, job);
  }
}

@Injectable()
@Processor(QUEUE.DEFAULT, { concurrency: QUEUE_SETTINGS[QUEUE.DEFAULT].concurrency })
export class DefaultQueueProcessor extends WorkerHost {
  constructor(private readonly runner: JobRunner) {
    super();
  }

  async process(job: Job<JobEnvelope<unknown>>): Promise<void> {
    await this.runner.run(QUEUE.DEFAULT, job);
  }
}
