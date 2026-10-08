import { Injectable } from '@nestjs/common';

import { ADMIN_PERMISSION_CATALOGUE, planPermissionMirror } from '#/core/permissions/index.js';
import { SEED_KIND, Seeder, type SeedKind, type SeedResult } from '#/core/seeding/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';

import { AdminPermissionRepository } from '../repositories/index.js';

/** Mirrors the admin catalogue into `admin_permissions`, by the rule `workspace-permissions` follows. */
@Injectable()
export class AdminPermissionSeeder extends Seeder {
  readonly key = 'admin-permissions';

  readonly kind: SeedKind = SEED_KIND.REFERENCE;

  readonly description =
    'The admin permission catalogue, mirrored for foreign keys and role editors.';

  constructor(
    private readonly permissionRepo: AdminPermissionRepository,
    private readonly transaction: TransactionService,
  ) {
    super();
  }

  async run(): Promise<SeedResult> {
    return this.transaction.run(async () => {
      const entries = ADMIN_PERMISSION_CATALOGUE.entries;

      const plan = planPermissionMirror(entries, await this.permissionRepo.findAll());

      await this.permissionRepo.createMany(plan.create);

      for (const row of plan.update) {
        await this.permissionRepo.update(row);
      }

      return {
        created: plan.create.length,
        updated: plan.update.length,
        skipped: entries.length - plan.create.length - plan.update.length,
        notes: plan.stale.map(
          (key) =>
            `"${key}" is in admin_permissions but not in the catalogue — remove it in a migration.`,
        ),
      };
    });
  }
}
