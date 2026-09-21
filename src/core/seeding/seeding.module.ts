import { type DynamicModule, Module } from '@nestjs/common';

import { SEED_ORDER } from './constants/index.js';
import type { SeedingModuleOptions } from './interfaces/index.js';
import { SeedRunner } from './services/seed-runner.service.js';

/**
 * Not global, and not part of `AppModule`.
 *
 * Seeding is a command-line concern: it is composed by `seed.module.ts` and
 * resolved by `prisma/seed.ts`. Keeping it out of the running application means
 * the HTTP process carries no code that can write seed data, and the seed
 * process carries no queue workers to keep it alive after it is done.
 */
@Module({})
export class SeedingModule {
  static forRoot(options: SeedingModuleOptions): DynamicModule {
    return {
      module: SeedingModule,
      imports: options.imports,
      providers: [{ provide: SEED_ORDER, useValue: options.order }, SeedRunner],
      exports: [SeedRunner],
    };
  }
}
