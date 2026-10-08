import { Injectable } from '@nestjs/common';

import { planPermissionMirror, WORKSPACE_PERMISSION_CATALOGUE } from '#/core/permissions/index.js';
import { SEED_KIND, Seeder, type SeedKind, type SeedResult } from '#/core/seeding/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';

import { WorkspacePermissionRepository } from '../repositories/index.js';

/**
 * Mirrors the workspace catalogue into `workspace_permissions`. A key the
 * table has and the catalogue no longer defines is reported, not deleted: a
 * custom role may still grant it, and removing it is a migration's decision.
 */
@Injectable()
export class WorkspacePermissionSeeder extends Seeder {
  readonly key = 'workspace-permissions';

  readonly kind: SeedKind = SEED_KIND.REFERENCE;

  readonly description =
    'The workspace permission catalogue, mirrored for foreign keys and role editors.';

  constructor(
    private readonly permissionRepo: WorkspacePermissionRepository,
    private readonly transaction: TransactionService,
  ) {
    super();
  }

  async run(): Promise<SeedResult> {
    return this.transaction.run(async () => {
      const entries = WORKSPACE_PERMISSION_CATALOGUE.entries;

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
            `"${key}" is in workspace_permissions but not in the catalogue — remove it in a migration.`,
        ),
      };
    });
  }
}
