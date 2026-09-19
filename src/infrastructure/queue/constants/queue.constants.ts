export const QUEUE = {
  EMAIL: 'email',
  WEBHOOKS: 'webhooks',
  IMPORTS: 'imports',
  DEFAULT: 'default',
} as const;

export type QueueName = (typeof QUEUE)[keyof typeof QUEUE];

export const QUEUE_NAMES: readonly QueueName[] = Object.values(QUEUE);

export const QUEUE_SETTINGS: Readonly<Record<QueueName, QueueWorkerSettings>> = {
  [QUEUE.EMAIL]: { concurrency: 10, attempts: 5, keepCompletedJobs: 0 },
  [QUEUE.WEBHOOKS]: { concurrency: 5, attempts: 8, keepCompletedJobs: 1_000 },
  [QUEUE.IMPORTS]: { concurrency: 2, attempts: 3, keepCompletedJobs: 1_000 },
  [QUEUE.DEFAULT]: { concurrency: 5, attempts: 3, keepCompletedJobs: 1_000 },
};

export interface QueueWorkerSettings {
  readonly concurrency: number;

  readonly attempts: number;

  readonly keepCompletedJobs: number;
}

export const JOB_DEFAULTS = {
  BACKOFF_TYPE: 'exponential',
  BACKOFF_DELAY_MS: 2_000,
  REMOVE_ON_FAIL_AGE_SECONDS: 604_800,
} as const;

export function buildQueuePrefix(redisKeyPrefix: string): string {
  const namespace = `${redisKeyPrefix}queue`;

  return `{${namespace}}`;
}

export const QUEUE_LOG_CONTEXT = 'Queue';

export const QUEUE_HEALTH_KEY = 'queue';

export const WORKER_HEALTH_KEY = 'queue-workers';

export const QUEUE_HEALTH_TIMEOUT_MS = 2_000;

export const DISPATCH_TIMEOUT_MS = 3_000;
