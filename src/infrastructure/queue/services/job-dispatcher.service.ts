import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { RequestContextService } from '#/core/context/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';

import { QUEUE_LOG_CONTEXT, type QueueName } from '../constants/queue.constants.js';
import type {
  DispatchOptions,
  JobEnvelope,
  PublishableJob,
  StoredJobOptions,
} from '../interfaces/index.js';
import { OutboxRepository } from '../outbox/index.js';
import { captureJobContext } from '../utils/job-context.util.js';

import { JobPublisher } from './job-publisher.service.js';

@Injectable()
export class JobDispatcher {
  constructor(
    private readonly outbox: OutboxRepository,

    private readonly publisher: JobPublisher,

    private readonly requestContext: RequestContextService,

    private readonly transactions: TransactionService,

    private readonly logger: AppLoggerService,
  ) {}

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

    const jobOptions = toStoredJobOptions(options);

    const jobId = options.jobId ?? randomUUID();

    if (jobId.includes(':')) {
      throw new Error(`Job id "${jobId}" contains ":", which BullMQ does not accept`);
    }

    const entry = await this.outbox.add({
      queue,
      jobName,
      payload: envelope as unknown as Prisma.InputJsonValue,
      options: jobOptions,
      idempotencyKey: jobId,
      ...(options.expiresAt !== undefined ? { expiresAt: options.expiresAt } : {}),
    });

    if (!entry.created) {
      return;
    }

    await this.transactions.runAfterCommit(() =>
      this.publishNow(entry.id, { queue, jobName, envelope, jobId, options: jobOptions }),
    );
  }

  private async publishNow(outboxId: string, job: PublishableJob): Promise<void> {
    const metadata = { queue: job.queue, jobName: job.jobName, jobId: job.jobId, outboxId };

    try {
      await this.publisher.publish(job);
      await this.outbox.markDispatched(outboxId);

      this.logger.debug(`Dispatched ${job.jobName}`, {
        context: QUEUE_LOG_CONTEXT,
        operation: 'dispatch',
        metadata,
      });
    } catch (error) {
      this.logger.warn(`Dispatch of ${job.jobName} left to the outbox relay`, {
        context: QUEUE_LOG_CONTEXT,
        operation: 'dispatch',
        metadata: { ...metadata, reason: error instanceof Error ? error.message : 'unknown' },
      });
    }
  }
}

function toStoredJobOptions(options: DispatchOptions): StoredJobOptions {
  return {
    ...(options.delayMs !== undefined ? { delayMs: options.delayMs } : {}),
    ...(options.attempts !== undefined ? { attempts: options.attempts } : {}),
    ...(options.priority !== undefined ? { priority: options.priority } : {}),
  };
}
