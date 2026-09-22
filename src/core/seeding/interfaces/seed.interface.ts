import type { ModuleMetadata, Type } from '@nestjs/common';

import type { SeedKind } from '../constants/index.js';
import type { Seeder } from '../ports/index.js';

export interface SeedResult {
  readonly created: number;

  readonly updated: number;

  readonly skipped: number;

  readonly notes?: readonly string[];
}

export interface SeedRunOptions {
  readonly kinds?: readonly SeedKind[];

  readonly only?: readonly string[];
}

export interface SeedRunSummary {
  readonly ran: number;

  readonly created: number;

  readonly updated: number;

  readonly skipped: number;
}

export interface SeedingModuleOptions {
  readonly imports: NonNullable<ModuleMetadata['imports']>;

  /** The seeders to run, in the order they must run. */
  readonly seeders: readonly Type<Seeder>[];
}
