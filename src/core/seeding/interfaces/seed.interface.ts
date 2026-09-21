import type { ModuleMetadata } from '@nestjs/common';

import type { SeedKind } from '../constants/index.js';

/**
 * What one seeder did, counted rather than described.
 *
 * `skipped` is not a failure — it is the normal answer on every run after the
 * first, and a seeder that reports nothing but skips is a seeder proving it is
 * idempotent.
 */
export interface SeedResult {
  readonly created: number;

  readonly updated: number;

  readonly skipped: number;

  /**
   * Anything the operator has to read: a generated password-reset link, a
   * permission in the database that the catalogue no longer defines.
   *
   * Never a secret that could have been avoided — see the admin seeder, which
   * creates no password at all rather than printing one.
   */
  readonly notes?: readonly string[];
}

export interface SeedRunOptions {
  /** Absent means every kind. */
  readonly kinds?: readonly SeedKind[];

  /** Seeder keys to run, ignoring `kinds`. Empty means all of them. */
  readonly only?: readonly string[];
}

export interface SeedRunSummary {
  readonly ran: number;

  readonly created: number;

  readonly updated: number;

  readonly skipped: number;
}

export interface SeedingModuleOptions {
  /** The modules providing seeders — each owns the table it seeds. */
  readonly imports: NonNullable<ModuleMetadata['imports']>;

  /** Every registered seeder key, in the order they must run. */
  readonly order: readonly string[];
}
