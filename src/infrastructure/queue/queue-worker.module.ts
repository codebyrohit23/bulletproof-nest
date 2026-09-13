import { Global, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';

import { WorkerHealthIndicator } from './indicators/worker-health.indicator.js';
import {
  DefaultQueueProcessor,
  ImportsQueueProcessor,
  EmailQueueProcessor,
  WebhooksQueueProcessor,
} from './processors/queue.processors.js';
import { JobHandlerRegistry } from './registry/job-handler.registry.js';
import { JobRunner } from './services/job-runner.service.js';

@Global()
@Module({
  imports: [DiscoveryModule, TerminusModule],

  providers: [
    JobHandlerRegistry,
    JobRunner,
    WorkerHealthIndicator,

    EmailQueueProcessor,
    WebhooksQueueProcessor,
    ImportsQueueProcessor,
    DefaultQueueProcessor,
  ],

  exports: [JobHandlerRegistry, WorkerHealthIndicator],
})
export class QueueWorkerModule {}
