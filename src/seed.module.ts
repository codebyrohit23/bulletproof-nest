import { Module } from '@nestjs/common';

import { AppConfigModule } from '#/config/index.js';
import { ContextModule } from '#/core/context/index.js';
import { AppLoggerModule } from '#/core/logger/index.js';
import { SeedingModule } from '#/core/seeding/index.js';
import { PrismaModule } from '#/infrastructure/database/prisma/index.js';
import { AdminSeeder, AdminsModule } from '#/modules/admins/index.js';

@Module({
  imports: [
    AppConfigModule,
    ContextModule,
    AppLoggerModule,
    PrismaModule,

    SeedingModule.forRoot({
      imports: [AdminsModule],
      seeders: [AdminSeeder],
    }),
  ],
})
export class SeedModule {}
