import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bullmq';

import { RequestContextService } from '#/core/context/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';
import { withTimeout } from '#/shared/utils/index.js';

import {
  DISPATCH_TIMEOUT_MS,
  JOB_DEFAULTS,
  QUEUE,
  QUEUE_LOG_CONTEXT,
  type QueueName,
} from '../constants/queue.constants.js';
import type { DispatchOptions, JobEnvelope } from '../interfaces/index.js';
import { captureJobContext } from '../utils/job-context.util.js';

@Injectable()
export class JobDispatcher {
  private readonly queues: Readonly<Record<QueueName, Queue>>;

  constructor(
    @InjectQueue(QUEUE.EMAIL) email: Queue,
    @InjectQueue(QUEUE.WEBHOOKS) webhooks: Queue,
    @InjectQueue(QUEUE.IMPORTS) imports: Queue,
    @InjectQueue(QUEUE.DEFAULT) fallback: Queue,

    private readonly requestContext: RequestContextService,

    private readonly transactions: TransactionService,

    private readonly logger: AppLoggerService,
  ) {
    this.queues = {
      [QUEUE.EMAIL]: email,
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
      /*
       * A timed-out add is not cancelled: the buffered command still runs if
       * Redis returns, so a caller's retry can enqueue twice. Pass `jobId`
       * where a duplicate matters.
       */
      const added = this.queues[queue].add(jobName, envelope, {
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

      await withTimeout(added, DISPATCH_TIMEOUT_MS, `Dispatch of ${jobName}`);

      this.logger.debug(`Dispatched ${jobName}`, {
        context: QUEUE_LOG_CONTEXT,
        operation: 'dispatch',
        metadata: { queue, jobName, jobId: options.jobId },
      });
    });
  }
}
