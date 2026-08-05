import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import {
  DefaultQueueProcessor,
  ImportsQueueProcessor,
  MailQueueProcessor,
  WebhooksQueueProcessor,
} from './processors/queue.processors.js';
import { JobHandlerRegistry } from './registry/job-handler.registry.js';
import { JobRunner } from './services/job-runner.service.js';

/**
 * The **consumer** side: one worker per queue, plus the registry that maps a
 * job name to its handler.
 *
 * Separate from `QueueModule` for one reason — the day the API gets slow enough
 * to justify a dedicated worker process, the split is:
 *
 *   app.module.ts     remove `QueueWorkerModule` from imports
 *   worker.module.ts  new: imports [AppModule, QueueWorkerModule]
 *   worker.ts         new: NestFactory.createApplicationContext(WorkerModule)
 *
 * No env flag decides this, because the process's role is not something that
 * should be able to disagree with the command that started it.
 *
 * `DiscoveryModule` is what lets `JobHandlerRegistry` find `@JobHandler`
 * classes anywhere in the container, so a module ships a job without editing
 * anything here.
 */
@Module({
  imports: [DiscoveryModule],

  providers: [
    JobHandlerRegistry,
    JobRunner,

    MailQueueProcessor,
    WebhooksQueueProcessor,
    ImportsQueueProcessor,
    DefaultQueueProcessor,
  ],

  exports: [JobHandlerRegistry],
})
export class QueueWorkerModule {}
