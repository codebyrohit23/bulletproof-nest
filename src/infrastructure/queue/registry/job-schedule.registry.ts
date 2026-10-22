import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { DiscoveryService, Reflector } from '@nestjs/core';

import { AppLoggerService } from '#/core/logger/index.js';

import { QUEUE_LOG_CONTEXT, QUEUE_NAMES } from '../constants/queue.constants.js';
import { JOB_HANDLER_METADATA } from '../decorators/job-handler.decorator.js';
import { SCHEDULED_JOB_METADATA } from '../decorators/scheduled-job.decorator.js';
import type { ScheduledJobDefinition, ScheduledJobOptions } from '../interfaces/index.js';
import { JobPublisher } from '../services/job-publisher.service.js';
import { captureJobContext } from '../utils/job-context.util.js';

@Injectable()
export class JobScheduleRegistry implements OnApplicationBootstrap {
  constructor(
    private readonly discovery: DiscoveryService,

    private readonly reflector: Reflector,

    private readonly publisher: JobPublisher,

    private readonly logger: AppLoggerService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const schedules = this.discover();

    try {
      await this.sync(schedules);

      this.logger.info(`Synced ${schedules.length} job schedule(s)`, {
        context: QUEUE_LOG_CONTEXT,
        operation: 'onApplicationBootstrap',
        metadata: {
          schedules: schedules.map(({ jobName, queue, pattern }) => ({ jobName, queue, pattern })),
        },
      });
    } catch (error) {
      this.logger.error(error, 'Job schedules could not be synced; existing ones still run', {
        context: QUEUE_LOG_CONTEXT,
        operation: 'onApplicationBootstrap',
      });
    }
  }

  private discover(): ScheduledJobDefinition[] {
    const schedules: ScheduledJobDefinition[] = [];

    for (const wrapper of this.discovery.getProviders()) {
      const instance: unknown = wrapper.instance;

      if (typeof instance !== 'object' || instance === null) {
        continue;
      }

      const options = this.reflector.get<ScheduledJobOptions | undefined>(
        SCHEDULED_JOB_METADATA,
        instance.constructor,
      );

      if (options === undefined) {
        continue;
      }

      const jobName = this.reflector.get<string | undefined>(
        JOB_HANDLER_METADATA,
        instance.constructor,
      );

      if (jobName === undefined) {
        throw new Error(
          `${instance.constructor.name} has @ScheduledJob but no @JobHandler: ` +
            'the schedule would enqueue a job no handler runs.',
        );
      }

      schedules.push({ jobName, ...options });
    }

    return schedules;
  }

  private async sync(schedules: readonly ScheduledJobDefinition[]): Promise<void> {
    // A scheduled job has no request behind it; the context gives it a
    // `requestId` all the same, so each run's logs are traceable as one unit.
    const envelope = {
      payload: {},
      context: captureJobContext(undefined),
      dispatchedAt: new Date().toISOString(),
    };

    for (const schedule of schedules) {
      await this.publisher.upsertSchedule(schedule, envelope);
    }

    for (const queue of QUEUE_NAMES) {
      const declared = new Set(
        schedules.filter((schedule) => schedule.queue === queue).map((s) => s.jobName),
      );

      for (const id of await this.publisher.scheduleIds(queue)) {
        if (!declared.has(id)) {
          await this.publisher.removeSchedule(queue, id);

          this.logger.info(`Removed job schedule ${id}, no longer declared`, {
            context: QUEUE_LOG_CONTEXT,
            operation: 'sync',
            metadata: { queue, jobName: id },
          });
        }
      }
    }
  }
}
