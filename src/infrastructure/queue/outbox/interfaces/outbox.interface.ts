import type { Prisma } from '@prisma/client';

import type { QueueName } from '../../constants/queue.constants.js';

export interface NewOutboxEntry {
  readonly queue: QueueName;

  readonly jobName: string;

  readonly payload: Prisma.InputJsonValue;

  readonly options?: Prisma.InputJsonValue;

  readonly idempotencyKey: string;

  readonly expiresAt?: Date;
}

export interface AddedOutboxEntry {
  readonly id: string;

  readonly created: boolean;
}

export interface ClaimedOutboxEntry {
  readonly id: string;

  readonly queue: string;

  readonly jobName: string;

  readonly payload: Prisma.JsonValue;

  readonly options: Prisma.JsonValue | null;

  readonly idempotencyKey: string;

  readonly attempts: number;

  readonly expiresAt: Date | null;
}

export interface OutboxBacklog {
  readonly pending: number;

  readonly oldestPendingSeconds: number;

  readonly failedInLastDay: number;
}

export interface OutboxBacklogRow {
  readonly pending: number;
  readonly oldest_pending_seconds: number;
  readonly failed: number;
}

export interface ClaimedOutboxRow {
  readonly id: string;
  readonly queue: string;
  readonly job_name: string;
  readonly payload: Prisma.JsonValue;
  readonly options: Prisma.JsonValue | null;
  readonly idempotency_key: string;
  readonly attempts: number;
  readonly expires_at: Date | null;
}
