import { Injectable } from '@nestjs/common';
import type { Job } from 'bullmq';

import { RequestContextService } from '#/core/context/index.js'; // value import — required for DI metadata
import { AppLoggerService } from '#/core/logger/index.js'; // value import — required for DI metadata

import { QUEUE_LOG_CONTEXT, QUEUE_SETTINGS, type QueueName } from '../constants/queue.constants.js';
import type { JobEnvelope, JobMeta } from '../interfaces/index.js';
import { JobHandlerRegistry } from '../registry/job-handler.registry.js'; // value import — required for DI metadata
import { restoreJobContext } from '../utils/job-context.util.js';

/**
 * Runs one job: restores its context, finds its handler, invokes it, logs.
 *
 * Shared by every queue's processor so the behaviour cannot drift between them.
 */
@Injectable()
export class JobRunner {
  constructor(
    private readonly registry: JobHandlerRegistry,

    private readonly requestContext: RequestContextService,

    private readonly logger: AppLoggerService,
  ) {}

  async run(queue: QueueName, job: Job<JobEnvelope<unknown>>): Promise<void> {
    const handler = this.registry.get(job.name);

    /*
     * An unknown job name means a handler was deleted or renamed while jobs
     * were still queued. Throwing lets BullMQ retry and then move it to the
     * failed set, where it stays visible — swallowing it would discard the job
     * silently, which is the worse failure.
     */
    if (handler === undefined) {
      throw new Error(`No handler registered for job "${job.name}" on queue "${queue}"`);
    }

    const envelope = job.data;
    const meta = this.buildMeta(queue, job);
    const startedAt = Date.now();

    await this.requestContext.run(restoreJobContext(envelope.context), async () => {
      this.logger.info(`Processing ${job.name}`, {
        context: QUEUE_LOG_CONTEXT,
        operation: 'run',
        metadata: { queue, jobName: job.name, jobId: meta.jobId, attempt: meta.attempt },
      });

      try {
        await handler.handle(envelope.payload, meta);

        this.logger.info(`Completed ${job.name}`, {
          context: QUEUE_LOG_CONTEXT,
          operation: 'run',
          metadata: {
            queue,
            jobName: job.name,
            jobId: meta.jobId,
            durationMs: Date.now() - startedAt,
          },
        });
      } catch (error) {
        const isFinalAttempt = meta.attempt >= meta.maxAttempts;

        /*
         * Logged at `error` only on the final attempt. A transient failure that
         * the next retry fixes is not an incident, and paging on it trains
         * people to ignore the alert that matters.
         */
        if (isFinalAttempt) {
          this.logger.error(error, `Job ${job.name} failed permanently`, {
            context: QUEUE_LOG_CONTEXT,
            operation: 'run',
            metadata: { queue, jobName: job.name, jobId: meta.jobId, attempts: meta.attempt },
          });
        } else {
          this.logger.warn(`Job ${job.name} failed — will retry`, {
            context: QUEUE_LOG_CONTEXT,
            operation: 'run',
            metadata: {
              queue,
              jobName: job.name,
              jobId: meta.jobId,
              attempt: meta.attempt,
              maxAttempts: meta.maxAttempts,
              reason: error instanceof Error ? error.message : 'unknown',
            },
          });
        }

        throw error;
      }
    });
  }

  private buildMeta(queue: QueueName, job: Job<JobEnvelope<unknown>>): JobMeta {
    return {
      jobId: job.id ?? 'unknown',
      jobName: job.name,
      queue,
      attempt: job.attemptsMade + 1,
      maxAttempts: job.opts.attempts ?? QUEUE_SETTINGS[queue].attempts,
      dispatchedAt: job.data.dispatchedAt,
    };
  }
}
