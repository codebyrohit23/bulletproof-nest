import { Module } from '@nestjs/common';

import { AppConfigModule } from '#/config/index.js';
import { ContextModule } from '#/core/context/index.js';
import { AppLoggerModule } from '#/core/logger/index.js';
import { SeedingModule } from '#/core/seeding/index.js';
import { PrismaModule } from '#/infrastructure/database/prisma/index.js';

/**
 * The composition root for `pnpm db:seed`, and the reason it is not
 * `AppModule`.
 *
 * `AppModule` imports `QueueWorkerModule`, which starts BullMQ workers. A seed
 * script built on it would finish its work and then sit there holding the
 * process open, which in CI is a job that never ends rather than a job that
 * fails. It also imports the HTTP surface, every guard and the rate limiter —
 * none of which a seeder can reach and all of which would need Redis up to
 * boot.
 *
 * So this lists only what a seeder needs: config, context and logging, the
 * database, and the modules that own the tables being seeded. Add a module here
 * when it provides a seeder, and add that seeder's key to `order` — the runner
 * refuses to start if the two disagree.
 *
 * `order` is where "what runs before what" is written down. Reference data
 * before anything that points at it: permissions before roles, roles before
 * any admin that is granted one.
 */
@Module({
  imports: [
    AppConfigModule,
    ContextModule,
    AppLoggerModule,
    PrismaModule,

    SeedingModule.forRoot({
      imports: [],
      order: [],
    }),
  ],
})
export class SeedModule {}
