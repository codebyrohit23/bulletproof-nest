import { type DynamicModule, Module } from '@nestjs/common';

import { SEEDERS } from './constants/index.js';
import type { SeedingModuleOptions } from './interfaces/index.js';
import { SeedRunner } from './services/seed-runner.service.js';

@Module({})
export class SeedingModule {
  static forRoot(options: SeedingModuleOptions): DynamicModule {
    return {
      module: SeedingModule,
      imports: options.imports,
      providers: [
        {
          provide: SEEDERS,
          useFactory: (...seeders: unknown[]) => seeders,
          inject: [...options.seeders],
        },
        SeedRunner,
      ],
      exports: [SeedRunner],
    };
  }
}
