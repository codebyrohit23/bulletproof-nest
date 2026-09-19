import {
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';

import { AppLoggerService } from '#/core/logger/index.js';

import { JobPublisher } from '../../services/job-publisher.service.js';
import { OUTBOX_LOG_CONTEXT, OUTBOX_RELAY, OUTBOX_RETENTION } from '../constants/index.js';
import type { ClaimedOutboxEntry } from '../interfaces/index.js';
import { OutboxRepository } from '../repositories/index.js';
import { isQueueName, outboxBackoffMs, toStoredJobOptions } from '../utils/index.js';

@Injectable()
export class OutboxRelay implements OnApplicationBootstrap, OnApplicationShutdown {
  private timer: NodeJS.Timeout | undefined;

  private inFlight: Promise<void> | undefined;

  private stopped = false;

  private lastPurgeAt = 0;

  private consecutiveFailures = 0;

  constructor(
    private readonly outbox: OutboxRepository,

    private readonly publisher: JobPublisher,

    private readonly logger: AppLoggerService,
  ) {}

  onApplicationBootstrap(): void {
    this.schedule(OUTBOX_RELAY.POLL_INTERVAL_MS);
  }

  async onApplicationShutdown(): Promise<void> {
    this.stopped = true;
    clearTimeout(this.timer);

    await this.inFlight;
  }

  private schedule(delayMs: number): void {
    if (this.stopped) {
      return;
    }

    this.timer = setTimeout(() => {
      this.inFlight = this.tick();
    }, delayMs);
  }

  private async tick(): Promise<void> {
    let claimed = 0;

    try {
      claimed = await this.relayBatch();
      await this.purgeIfDue();
      this.recordRecovery();
    } catch (error) {
      this.recordFailedTick(error);
    } finally {
      this.schedule(this.nextDelayMs(claimed));
    }
  }

  private nextDelayMs(claimed: number): number {
    if (this.consecutiveFailures > 0) {
      return Math.min(
        OUTBOX_RELAY.POLL_INTERVAL_MS * 2 ** this.consecutiveFailures,
        OUTBOX_RELAY.TICK_BACKOFF_MAX_MS,
      );
    }

    return claimed >= OUTBOX_RELAY.BATCH_SIZE ? 0 : OUTBOX_RELAY.POLL_INTERVAL_MS;
  }

  private recordFailedTick(error: unknown): void {
    this.consecutiveFailures += 1;

    const log = { context: OUTBOX_LOG_CONTEXT, operation: 'tick' };

    if (this.consecutiveFailures === 1) {
      this.logger.error(error, 'Outbox relay tick failed', log);

      return;
    }

    this.logger.warn('Outbox relay still failing', {
      ...log,
      metadata: {
        consecutiveFailures: this.consecutiveFailures,
        reason: error instanceof Error ? error.message : 'unknown',
      },
    });
  }

  private recordRecovery(): void {
    if (this.consecutiveFailures === 0) {
      return;
    }

    this.logger.info(`Outbox relay recovered after ${this.consecutiveFailures} failed ticks`, {
      context: OUTBOX_LOG_CONTEXT,
      operation: 'tick',
    });

    this.consecutiveFailures = 0;
  }

  private async relayBatch(): Promise<number> {
    const entries = await this.outbox.claimDue(OUTBOX_RELAY.BATCH_SIZE, OUTBOX_RELAY.LEASE_MS);

    await Promise.allSettled(entries.map((entry) => this.relay(entry)));

    return entries.length;
  }

  private async relay(entry: ClaimedOutboxEntry): Promise<void> {
    const metadata = { outboxId: entry.id, queue: entry.queue, jobName: entry.jobName };

    if (entry.expiresAt !== null && entry.expiresAt.getTime() <= Date.now()) {
      await this.outbox.markExpired(entry.id);

      this.logger.warn(`Outbox job ${entry.jobName} expired before it was published`, {
        context: OUTBOX_LOG_CONTEXT,
        operation: 'relay',
        metadata,
      });

      return;
    }

    if (!isQueueName(entry.queue)) {
      const error = new Error(`Unknown queue "${entry.queue}"`);

      await this.outbox.markFailed(entry.id, error.message);

      this.logger.error(error, 'Outbox job names a queue that does not exist', {
        context: OUTBOX_LOG_CONTEXT,
        operation: 'relay',
        metadata,
      });

      return;
    }

    try {
      await this.publisher.publish({
        queue: entry.queue,
        jobName: entry.jobName,
        envelope: entry.payload,
        jobId: entry.idempotencyKey,
        options: toStoredJobOptions(entry.options),
      });

      await this.outbox.markDispatched(entry.id);
    } catch (error) {
      await this.recordFailure(entry, error);
    }
  }

  private async recordFailure(entry: ClaimedOutboxEntry, error: unknown): Promise<void> {
    const reason = error instanceof Error ? error.message : 'unknown';
    const attempt = entry.attempts + 1;
    const metadata = { outboxId: entry.id, queue: entry.queue, jobName: entry.jobName, attempt };

    if (attempt >= OUTBOX_RELAY.MAX_ATTEMPTS) {
      await this.outbox.markFailed(entry.id, reason);

      this.logger.error(error, `Outbox job ${entry.jobName} abandoned after ${attempt} attempts`, {
        context: OUTBOX_LOG_CONTEXT,
        operation: 'relay',
        metadata,
      });

      return;
    }

    await this.outbox.reschedule(entry.id, outboxBackoffMs(attempt), reason);

    this.logger.warn(`Outbox job ${entry.jobName} could not be published; will retry`, {
      context: OUTBOX_LOG_CONTEXT,
      operation: 'relay',
      metadata: { ...metadata, reason },
    });
  }

  private async purgeIfDue(): Promise<void> {
    const now = Date.now();

    if (now - this.lastPurgeAt < OUTBOX_RETENTION.PURGE_INTERVAL_MS) {
      return;
    }

    this.lastPurgeAt = now;

    const cutoff = new Date(now - OUTBOX_RETENTION.KEEP_FOR_MS);
    let deleted: number;

    do {
      deleted = await this.outbox.purgeFinishedBefore(cutoff, OUTBOX_RETENTION.PURGE_BATCH_SIZE);
    } while (deleted === OUTBOX_RETENTION.PURGE_BATCH_SIZE && !this.stopped);
  }
}
