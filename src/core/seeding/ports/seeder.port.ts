import type { SeedKind } from '../constants/index.js';
import type { SeedResult } from '../interfaces/index.js';

/**
 * One body of seed data, owned by the module that owns the table it writes.
 *
 * A port for the usual reason: `core` needs seeders, but the tables belong to
 * feature modules and `core` may not import one. So `core` states the
 * requirement, each module satisfies it, and the seed composition root — the
 * only place entitled to know all of them — connects them:
 *
 * ```ts
 * // modules/admins/admins.module.ts
 * providers: [AdminSeeder, { provide: Seeder, useExisting: AdminSeeder, multi: true }];
 * exports: [Seeder];
 *
 * // seed.module.ts
 * SeedingModule.forRoot({ imports: [AdminsModule], order: ['admins'] });
 * ```
 *
 * `multi: true` is what makes several modules able to answer the same token.
 * `useExisting` rather than `useClass` for the reason it is used everywhere
 * else here — it aliases the one instance rather than building a second.
 *
 * ---------------------------------------------------------------------------
 * WHAT AN IMPLEMENTATION MUST GUARANTEE
 * ---------------------------------------------------------------------------
 * **`run` is idempotent.** It is called again on every deploy and after every
 * `migrate reset`. Reference data upserts by natural key; bootstrap data
 * creates only what is absent and never overwrites — re-running must not reset
 * a password somebody has since changed.
 *
 * **It never deletes.** A permission the catalogue no longer defines may still
 * be referenced by a role. Report it in `notes` and let a human decide.
 *
 * **It wraps its own writes.** A seeder that writes several related rows uses
 * `TransactionService`; the runner does not wrap, because seeders are
 * independent and one failing should not roll back the ones that succeeded.
 */
export abstract class Seeder {
  /** Stable identifier. Names the seeder in `--only` and in the run order. */
  abstract readonly key: string;

  abstract readonly kind: SeedKind;

  /** One line, shown in the run log. */
  abstract readonly description: string;

  abstract run(): Promise<SeedResult>;
}
