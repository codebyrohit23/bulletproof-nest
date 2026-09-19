import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';

import { AppConfigModule } from '#/config/index.js';
import { RedisConfigService } from '#/config/redis/index.js';

import { QUEUE_NAMES, buildQueuePrefix } from './constants/queue.constants.js';
import { QueueHealthIndicator } from './indicators/queue-health.indicator.js';
import { OutboxHealthIndicator, OutboxRepository } from './outbox/index.js';
import { JobDispatcher } from './services/job-dispatcher.service.js';
import { JobPublisher } from './services/job-publisher.service.js';

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

          maxRetriesPerRequest: null,

          ...(redisConfig.tls !== undefined ? { tls: redisConfig.tls } : {}),
        },
      }),
    }),

    ...QUEUE_NAMES.map((name) => BullModule.registerQueue({ name })),

    TerminusModule,
  ],

  providers: [
    JobDispatcher,
    JobPublisher,
    OutboxRepository,
    QueueHealthIndicator,
    OutboxHealthIndicator,
  ],
  exports: [BullModule, JobDispatcher, QueueHealthIndicator, OutboxHealthIndicator],
})
export class QueueModule {}
