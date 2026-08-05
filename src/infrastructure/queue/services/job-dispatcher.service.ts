import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';

import { RequestContextService } from '@/core/context/index.js'; // value import — required for DI metadata
import { AppLoggerService } from '@/core/logger/index.js'; // value import — required for DI metadata
import { TransactionService } from '@/infrastructure/database/prisma/index.js'; // value import — required for DI metadata

import { JOB_DEFAULTS, QUEUE, QUEUE_LOG_CONTEXT, type QueueName } from '../constants/queue.constants.js';
import type { DispatchOptions, JobEnvelope } from '../interfaces/index.js';
import { captureJobContext } from '../utils/job-context.util.js';

/**
 * The only supported way to enqueue work.
 *
 * Two behaviours are automatic here rather than remembered at each call site,
 * because forgetting either produces a bug that is hard to reproduce:
 *
 * **Context is captured.** The organization, user and request id are snapshotted
 * into the envelope so the worker can restore them. Without this a tenant-scoped
 * job has no tenant.
 *
 * **Dispatch waits for the commit.** Enqueueing inside a database transaction is
 * the classic distributed race: a worker on another process can pick the job up
 * within milliseconds and read a row that has not been committed yet. Deferring
 * to `runAfterCommit` removes it entirely, and outside a transaction the hook
 * runs immediately — so callers never think about it.
 */
@Injectable()
export class JobDispatcher {
  private readonly queues: Readonly<Record<QueueName, Queue>>;

  constructor(
    @InjectQueue(QUEUE.MAIL) mail: Queue,
    @InjectQueue(QUEUE.WEBHOOKS) webhooks: Queue,
    @InjectQueue(QUEUE.IMPORTS) imports: Queue,
    @InjectQueue(QUEUE.DEFAULT) fallback: Queue,

    private readonly requestContext: RequestContextService,

    private readonly transactions: TransactionService,

    private readonly logger: AppLoggerService,
  ) {
    this.queues = {
      [QUEUE.MAIL]: mail,
      [QUEUE.WEBHOOKS]: webhooks,
      [QUEUE.IMPORTS]: imports,
      [QUEUE.DEFAULT]: fallback,
    };
  }

  async dispatch<TPayload>(
    queue: QueueName,
    jobName: string,
    payload: TPayload,
    options: DispatchOptions = {},
  ): Promise<void> {
    const envelope: JobEnvelope<TPayload> = {
      payload,
      context: captureJobContext(this.requestContext.get()),
      dispatchedAt: new Date().toISOString(),
    };

    await this.transactions.runAfterCommit(async () => {
      await this.queues[queue].add(jobName, envelope, {
        ...(options.jobId !== undefined ? { jobId: options.jobId } : {}),
        ...(options.delayMs !== undefined ? { delay: options.delayMs } : {}),
        ...(options.attempts !== undefined ? { attempts: options.attempts } : {}),
        ...(options.priority !== undefined ? { priority: options.priority } : {}),

        backoff: {
          type: JOB_DEFAULTS.BACKOFF_TYPE,
          delay: JOB_DEFAULTS.BACKOFF_DELAY_MS,
        },

        removeOnComplete: { count: JOB_DEFAULTS.REMOVE_ON_COMPLETE_COUNT },
        removeOnFail: { age: JOB_DEFAULTS.REMOVE_ON_FAIL_AGE_SECONDS },
      });

      this.logger.debug(`Dispatched ${jobName}`, {
        context: QUEUE_LOG_CONTEXT,
        operation: 'dispatch',
        metadata: { queue, jobName, jobId: options.jobId },
      });
    });
  }
}
