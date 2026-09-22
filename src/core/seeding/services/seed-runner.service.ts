import { Inject, Injectable } from '@nestjs/common';

import { AppConfigService } from '#/config/app/index.js';
import { AppLoggerService } from '#/core/logger/index.js';

import { SEEDERS, SEEDING_LOG_CONTEXT } from '../constants/index.js';
import type { SeedRunOptions, SeedRunSummary } from '../interfaces/index.js';
import type { Seeder } from '../ports/index.js';

@Injectable()
export class SeedRunner {
  constructor(
    @Inject(SEEDERS)
    private readonly seeders: readonly Seeder[],
    private readonly appConfig: AppConfigService,
    private readonly logger: AppLoggerService,
  ) {}

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
    const registered = this.registered();
    const only = options.only ?? [];

    if (only.length > 0) {
      const unknown = only.filter((key) => !registered.some((seeder) => seeder.key === key));

      if (unknown.length > 0) {
        throw new Error(
          `No such seeder: ${unknown.join(', ')}. ` +
            `Registered: ${registered.map((seeder) => seeder.key).join(', ') || '(none)'}.`,
        );
      }

      return registered.filter((seeder) => only.includes(seeder.key));
    }

    const kinds = options.kinds;

    return kinds === undefined
      ? registered
      : registered.filter((seeder) => kinds.includes(seeder.kind));
  }

  private registered(): readonly Seeder[] {
    const keys = new Set(this.seeders.map((seeder) => seeder.key));

    if (keys.size !== this.seeders.length) {
      throw new Error(
        'Two seeders share a key. A key names one seeder in --only and in the run log.',
      );
    }

    return this.seeders;
  }
}
