/**
 * Queues, grouped by **workload class** — never one per feature module.
 *
 * A queue is a concurrency and latency boundary, not an ownership boundary. A
 * forty-minute CSV import sharing a queue with password-reset email means the
 * email waits behind it.
 *
 * It is also a connection budget: every worker holds one **blocking** Redis
 * connection. One queue per module would be fifteen blocking connections before
 * a single job is processed.
 *
 * Modules add *jobs* to these queues. They do not add queues.
 */
export const QUEUE = {
  MAIL: 'mail',
  WEBHOOKS: 'webhooks',
  IMPORTS: 'imports',
  DEFAULT: 'default',
} as const;

export type QueueName = (typeof QUEUE)[keyof typeof QUEUE];

export const QUEUE_NAMES: readonly QueueName[] = Object.values(QUEUE);

/**
 * Per-queue worker behaviour.
 *
 * Code, not environment: these are design decisions reviewed in a pull request,
 * and they are identical everywhere the app runs.
 *
 * `IMPORTS` is deliberately throttled — imports are memory-hungry, and running
 * many at once on one worker is how a pod gets OOM-killed mid-job.
 */
export const QUEUE_SETTINGS: Readonly<Record<QueueName, QueueWorkerSettings>> = {
  [QUEUE.MAIL]: { concurrency: 10, attempts: 5 },
  [QUEUE.WEBHOOKS]: { concurrency: 5, attempts: 8 },
  [QUEUE.IMPORTS]: { concurrency: 2, attempts: 3 },
  [QUEUE.DEFAULT]: { concurrency: 5, attempts: 3 },
};

export interface QueueWorkerSettings {
  readonly concurrency: number;

  readonly attempts: number;
}

/**
 * Applied to every job unless a producer overrides it.
 *
 * `removeOnFail` keeps a week of failures so they stay visible in Bull Board.
 * Cleaning them aggressively would discard the evidence needed to work out why
 * something broke.
 */
export const JOB_DEFAULTS = {
  BACKOFF_TYPE: 'exponential',
  BACKOFF_DELAY_MS: 2_000,
  REMOVE_ON_COMPLETE_COUNT: 1_000,
  REMOVE_ON_FAIL_AGE_SECONDS: 604_800,
} as const;

/**
 * BullMQ's own key namespace.
 *
 * Braces are required, not decorative: BullMQ runs multi-key Lua scripts, and
 * in a Redis Cluster every key they touch must hash to the same slot. Without
 * the hash tag the queue refuses to start. On a standalone server they are
 * inert characters, so wrapping always costs nothing and removes a migration.
 *
 * Derived from the application's Redis prefix rather than configured
 * separately — two variables naming one namespace would eventually disagree.
 */
export function buildQueuePrefix(redisKeyPrefix: string): string {
  const namespace = `${redisKeyPrefix}queue`;

  return `{${namespace}}`;
}

export const QUEUE_LOG_CONTEXT = 'Queue';

export const QUEUE_HEALTH_KEY = 'queue';
