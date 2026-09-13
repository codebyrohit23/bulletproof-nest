import type { WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { type HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';

import {
  QUEUE,
  QUEUE_NAMES,
  WORKER_HEALTH_KEY,
  type QueueName,
} from '../constants/queue.constants.js';
import {
  DefaultQueueProcessor,
  EmailQueueProcessor,
  ImportsQueueProcessor,
  WebhooksQueueProcessor,
} from '../processors/queue.processors.js';

@Injectable()
export class WorkerHealthIndicator {
  private readonly hosts: Readonly<Record<QueueName, WorkerHost>>;

  constructor(
    email: EmailQueueProcessor,
    webhooks: WebhooksQueueProcessor,
    imports: ImportsQueueProcessor,
    fallback: DefaultQueueProcessor,

    private readonly healthIndicatorService: HealthIndicatorService,
  ) {
    this.hosts = {
      [QUEUE.EMAIL]: email,
      [QUEUE.WEBHOOKS]: webhooks,
      [QUEUE.IMPORTS]: imports,
      [QUEUE.DEFAULT]: fallback,
    };
  }

  isHealthy(key: string = WORKER_HEALTH_KEY): HealthIndicatorResult {
    const indicator = this.healthIndicatorService.check(key);
    const stopped = QUEUE_NAMES.filter((name) => !this.isRunning(this.hosts[name]));

    return stopped.length === 0
      ? indicator.up({ queues: QUEUE_NAMES })
      : indicator.down({ stopped });
  }

  /** `worker` throws until the BullMQ explorer has created it. */
  private isRunning(host: WorkerHost): boolean {
    try {
      return host.worker.isRunning();
    } catch {
      return false;
    }
  }
}
