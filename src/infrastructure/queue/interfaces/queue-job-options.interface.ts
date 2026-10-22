import type { JobsOptions } from 'bullmq';

/** The options every job on a queue carries, dispatched or scheduled. */
export type QueueJobOptions = Required<
  Pick<JobsOptions, 'attempts' | 'backoff' | 'removeOnComplete' | 'removeOnFail'>
>;
