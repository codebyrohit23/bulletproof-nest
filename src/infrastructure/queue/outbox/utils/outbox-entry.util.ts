import type { Prisma } from '@prisma/client';

import { QUEUE_NAMES, type QueueName } from '../../constants/queue.constants.js';
import type { StoredJobOptions } from '../../interfaces/index.js';
import { OUTBOX_RELAY } from '../constants/index.js';

/** A queue name read back from the database is a claim until it is checked. */
export function isQueueName(value: string): value is QueueName {
  return (QUEUE_NAMES as readonly string[]).includes(value);
}

export function toStoredJobOptions(value: Prisma.JsonValue | null): StoredJobOptions {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const { delayMs, attempts, priority } = value;

  return {
    ...(typeof delayMs === 'number' ? { delayMs } : {}),
    ...(typeof attempts === 'number' ? { attempts } : {}),
    ...(typeof priority === 'number' ? { priority } : {}),
  };
}

export function outboxBackoffMs(attempt: number): number {
  return Math.min(OUTBOX_RELAY.BACKOFF_BASE_MS * 2 ** (attempt - 1), OUTBOX_RELAY.BACKOFF_MAX_MS);
}
