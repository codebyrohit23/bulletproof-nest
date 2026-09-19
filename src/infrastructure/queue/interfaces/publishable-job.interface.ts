import type { QueueName } from '../constants/queue.constants.js';

import type { DispatchOptions } from './dispatch-options.interface.js';

export type StoredJobOptions = Pick<DispatchOptions, 'delayMs' | 'attempts' | 'priority'>;

export interface PublishableJob {
  readonly queue: QueueName;

  readonly jobName: string;

  readonly envelope: unknown;

  readonly jobId: string;

  readonly options: StoredJobOptions;
}
