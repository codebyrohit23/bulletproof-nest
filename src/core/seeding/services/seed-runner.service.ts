import { Inject, Injectable, Optional } from '@nestjs/common';

import { AppConfigService } from '#/config/app/index.js';
import { AppLoggerService } from '#/core/logger/index.js';

import { SEED_ORDER, SEEDING_LOG_CONTEXT } from '../constants/index.js';
import type { SeedRunOptions, SeedRunSummary } from '../interfaces/index.js';
import { Seeder } from '../ports/index.js';

/**
 * Runs the registered seeders, in the declared order, once each.
 *
 * Sequential and deliberately not parallel: seeders are ordered because they
 * depend on each other — roles reference permissions — and running them at once
 * would make that ordering decorative.
 */
@Injectable()
export class SeedRunner {
  private readonly seeders: readonly Seeder[];

  constructor(
    /*
     * `@Optional` because a `multi` token with no providers does not resolve to
     * an empty array — it does not resolve at all. That is the state of this
     * application until the first module registers a seeder, and refusing to
     * construct the runner over it would turn "nothing to seed yet" into a
     * container that will not build.
     */
    @Optional()
    @Inject(Seeder)
    seeders: Seeder[] | undefined,
    @Inject(SEED_ORDER)
    private readonly order: readonly string[],
    private readonly appConfig: AppConfigService,
    private readonly logger: AppLoggerService,
  ) {
    this.seeders = seeders ?? [];
  }

  async run(options: SeedRunOptions = {}): Promise<SeedRunSummary> {
    const selected = this.select(options);

    if (selected.length === 0) {
      this.logger.warn('Nothing to seed', {
        context: SEEDING_LOG_CONTEXT,
        operation: 'run',
        metadata: { registered: this.seeders.length, environment: this.appConfig.env },
      });

      return { ran: 0, created: 0, updated: 0, skipped: 0 };
    }

    let summary: SeedRunSummary = { ran: 0, created: 0, updated: 0, skipped: 0 };

    for (const seeder of selected) {
      const result = await seeder.run();

      summary = {
        ran: summary.ran + 1,
        created: summary.created + result.created,
        updated: summary.updated + result.updated,
        skipped: summary.skipped + result.skipped,
      };

      this.logger.info(`Seeded ${seeder.key}`, {
        context: SEEDING_LOG_CONTEXT,
        operation: 'run',
        metadata: {
          key: seeder.key,
          kind: seeder.kind,
          created: result.created,
          updated: result.updated,
          skipped: result.skipped,
          ...(result.notes !== undefined && result.notes.length > 0 ? { notes: result.notes } : {}),
        },
      });
    }

    this.logger.info('Seeding complete', {
      context: SEEDING_LOG_CONTEXT,
      operation: 'run',
      metadata: { ...summary, environment: this.appConfig.env },
    });

    return summary;
  }

  /**
   * `--only` names seeders explicitly and overrides the kind filter, so an
   * operator can re-run one seeder without also having to know what a kind
   * means. With neither, everything registered runs.
   */
  private select(options: SeedRunOptions): readonly Seeder[] {
    const ordered = this.ordered();
    const only = options.only ?? [];

    if (only.length > 0) {
      const unknown = only.filter((key) => !ordered.some((seeder) => seeder.key === key));

      if (unknown.length > 0) {
        throw new Error(
          `No such seeder: ${unknown.join(', ')}. Registered: ${this.order.join(', ') || '(none)'}.`,
        );
      }

      return ordered.filter((seeder) => only.includes(seeder.key));
    }

    const kinds = options.kinds;

    return kinds === undefined ? ordered : ordered.filter((seeder) => kinds.includes(seeder.kind));
  }

  /**
   * The registered seeders in the declared order, refusing loudly if the two
   * have drifted.
   *
   * A seeder that is registered but unlisted would otherwise run last by
   * accident of provider order, which is exactly the kind of ordering nobody
   * can see and nobody chose.
   */
  private ordered(): readonly Seeder[] {
    const byKey = new Map(this.seeders.map((seeder) => [seeder.key, seeder]));

    if (byKey.size !== this.seeders.length) {
      throw new Error('Two seeders share a key. Keys name a seeder in --only and must be unique.');
    }

    const unlisted = this.seeders.filter((seeder) => !this.order.includes(seeder.key));

    if (unlisted.length > 0) {
      throw new Error(
        `Registered but missing from the seed order: ${unlisted.map((s) => s.key).join(', ')}. ` +
          'Add them to SeedingModule.forRoot({ order }) so what runs before what stays readable ' +
          'in one place.',
      );
    }

    const absent = this.order.filter((key) => !byKey.has(key));

    if (absent.length > 0) {
      throw new Error(
        `Listed in the seed order but not registered: ${absent.join(', ')}. ` +
          'Either the module providing it is missing from SeedingModule.forRoot({ imports }), ' +
          'or the entry is left over from a seeder that was removed.',
      );
    }

    return this.order.map((key) => byKey.get(key)!);
  }
}
