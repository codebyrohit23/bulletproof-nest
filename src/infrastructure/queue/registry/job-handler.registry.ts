import { Injectable, type OnModuleInit } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';

import { AppLoggerService } from '@/core/logger/index.js'; // value import — required for DI metadata

import { QUEUE_LOG_CONTEXT } from '../constants/queue.constants.js';
import { JOB_HANDLER_METADATA } from '../decorators/job-handler.decorator.js';
import type { JobHandler } from '../interfaces/index.js';

/**
 * Maps a job name to the provider that handles it.
 *
 * Built by scanning the container at boot rather than from a hand-maintained
 * list, so a module ships a job by adding one class — no central file to edit
 * and no chance of a handler existing but never being wired up.
 */
@Injectable()
export class JobHandlerRegistry implements OnModuleInit {
  private readonly handlers = new Map<string, JobHandler<unknown>>();

  constructor(
    private readonly discovery: DiscoveryService,

    private readonly reflector: Reflector,

    private readonly logger: AppLoggerService,
  ) {}

  onModuleInit(): void {
    for (const wrapper of this.discovery.getProviders()) {
      /*
       * Nest types `instance` as `any`. Narrowing through `unknown` keeps the
       * scan honest rather than letting an untyped value flow into the map.
       */
      const instance: unknown = wrapper.instance;

      if (typeof instance !== 'object' || instance === null) {
        continue;
      }

      const jobName = this.reflector.get<string | undefined>(JOB_HANDLER_METADATA, instance.constructor);

      if (jobName === undefined) {
        continue;
      }

      this.register(jobName, instance as JobHandler<unknown>);
    }

    this.logger.info(`Registered ${this.handlers.size} job handler(s)`, {
      context: QUEUE_LOG_CONTEXT,
      operation: 'onModuleInit',
      metadata: { jobs: [...this.handlers.keys()] },
    });
  }

  get(jobName: string): JobHandler<unknown> | undefined {
    return this.handlers.get(jobName);
  }

  get registeredJobNames(): readonly string[] {
    return [...this.handlers.keys()];
  }

  /**
   * Two handlers claiming one job name is always a mistake — a copy-paste, or a
   * job renamed in one place. Only one could ever run, so it fails at boot
   * rather than silently picking whichever was discovered last.
   */
  private register(jobName: string, handler: JobHandler<unknown>): void {
    const existing = this.handlers.get(jobName);

    if (existing !== undefined) {
      throw new Error(
        `Duplicate job handler for "${jobName}": ` +
          `${existing.constructor.name} and ${handler.constructor.name} both claim it.`,
      );
    }

    this.handlers.set(jobName, handler);
  }
}
