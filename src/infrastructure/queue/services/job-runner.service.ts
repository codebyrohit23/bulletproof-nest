import { Injectable } from '@nestjs/common';
import { UnrecoverableError, type Job } from 'bullmq';

import { RequestContextService } from '#/core/context/index.js';
import { AppLoggerService } from '#/core/logger/index.js';

import { QUEUE_LOG_CONTEXT, QUEUE_SETTINGS, type QueueName } from '../constants/queue.constants.js';
import type { JobEnvelope, JobMeta } from '../interfaces/index.js';
import { JobHandlerRegistry } from '../registry/job-handler.registry.js';
import { restoreJobContext } from '../utils/job-context.util.js';
import { isNonRetryable } from '../utils/job-error.util.js';

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
        /*
         * A handler that reports its failure as non-retryable is final on the
         * first attempt. Reading `attempt >= maxAttempts` alone would log "will
         * retry" about a job that is about to stop, and bury the real reason
         * under four more identical warnings.
         */
        const nonRetryable = isNonRetryable(error);
        const isFinalAttempt = nonRetryable || meta.attempt >= meta.maxAttempts;

        /*
         * Logged at `error` only on the final attempt. A transient failure that
         * the next retry fixes is not an incident, and paging on it trains
         * people to ignore the alert that matters.
         */
        if (isFinalAttempt) {
          this.logger.error(error, `Job ${job.name} failed permanently`, {
            context: QUEUE_LOG_CONTEXT,
            operation: 'run',
            metadata: {
              queue,
              jobName: job.name,
              jobId: meta.jobId,
              attempts: meta.attempt,
              retryable: !nonRetryable,
            },
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

        /*
         * BullMQ decides whether to retry by looking at the error type, so this
         * is the only way to say "do not". Retrying a malformed payload or a
         * rejected recipient cannot succeed — it just spends five attempts and
         * two minutes of backoff arriving at the same answer, with the useful
         * error buried under four retry warnings.
         *
         * The original error was logged in full immediately above, so nothing is
         * lost by replacing it with its own message here.
         */
        if (nonRetryable) {
          throw new UnrecoverableError(error instanceof Error ? error.message : String(error));
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
