import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';

import { AppConfigModule } from '@/config/index.js';
import { RedisConfigService } from '@/config/redis/index.js';

import { QUEUE_NAMES, buildQueuePrefix } from './constants/queue.constants.js';
import { JobDispatcher } from './services/job-dispatcher.service.js';

/**
 * The **producer** side: connections, queue registration, and `JobDispatcher`.
 *
 * Always imported. Any process that can create work needs to enqueue it, even
 * one that never processes a job itself.
 *
 * Workers live in `QueueWorkerModule` deliberately. Today both are imported by
 * `AppModule` and one process does everything; when traffic justifies a
 * separate worker process, moving that one import is the whole change.
 *
 * BullMQ is given connection *options* rather than an existing client: it opens
 * its own connections, and workers use blocking commands that would monopolise
 * a shared one.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [RedisConfigService],
      useFactory: (redisConfig: RedisConfigService) => ({
        prefix: buildQueuePrefix(redisConfig.keyPrefix),

        connection: {
          url: redisConfig.url,
          connectTimeout: redisConfig.connectTimeoutMs,

          /*
           * BullMQ requires this and refuses to start otherwise — its blocking
           * commands have no meaningful retry limit.
           */
          maxRetriesPerRequest: null,

          ...(redisConfig.tls !== undefined ? { tls: redisConfig.tls } : {}),
        },
      }),
    }),

    ...QUEUE_NAMES.map((name) => BullModule.registerQueue({ name })),
  ],

  providers: [JobDispatcher],
  exports: [BullModule, JobDispatcher],
})
export class QueueModule {}
