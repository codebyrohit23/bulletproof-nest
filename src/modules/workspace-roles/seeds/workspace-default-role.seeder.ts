import { Injectable } from '@nestjs/common';

import { WORKSPACE_PERMISSION_CATALOGUE } from '#/core/permissions/index.js';
import { SEED_KIND, Seeder, type SeedKind, type SeedResult } from '#/core/seeding/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';

import { WORKSPACE_DEFAULT_ROLES } from '../constants/index.js';
import { WorkspaceRoleRepository } from '../repositories/index.js';

/**
 * The default roles' rows, upserted by `key`, and their grants. Runs after
 * `workspace-permissions`, whose rows the grants reference.
 *
 * Grants are synced exactly — added and removed — to the keys whose
 * `defaultFor` names the role. This is the one place a seeder deletes, and it
 * is safe for the reason it is needed: nothing but this seeder writes a default
 * role's grants, so a grant the code no longer gives is one nobody else meant.
 *
 * The resolver does not read these grants; it takes a default role's
 * permissions from the catalogue. The rows exist for role lists, reports and
 * the foreign keys of `workspace_member_roles`.
 */
@Injectable()
export class WorkspaceDefaultRoleSeeder extends Seeder {
  readonly key = 'workspace-default-roles';

  readonly kind: SeedKind = SEED_KIND.REFERENCE;

  readonly description = 'Admin, Manager and Agent, shared by every workspace, and their grants.';

  constructor(
    private readonly roleRepo: WorkspaceRoleRepository,
    private readonly transaction: TransactionService,
  ) {
    super();
  }

  async run(): Promise<SeedResult> {
    return this.transaction.run(async () => {
      let created = 0;

      let updated = 0;

      let skipped = 0;

      const notes: string[] = [];

      for (const key of WORKSPACE_PERMISSION_CATALOGUE.defaultRoles) {
        const definition = WORKSPACE_DEFAULT_ROLES[key];

        const existing = await this.roleRepo.findDefaultRole(key);

        let changed = false;

        let roleId: string;

        if (existing === null) {
          roleId = await this.roleRepo.createDefaultRole(key, definition);
        } else {
          roleId = existing.id;

          if (
            existing.name !== definition.name ||
            existing.description !== definition.description
          ) {
            await this.roleRepo.updateDefaultRole(roleId, definition);

            changed = true;
          }
        }

        const desired: ReadonlySet<string> = WORKSPACE_PERMISSION_CATALOGUE.defaultsFor(key);

        const current = new Set(await this.roleRepo.findGrantKeys(roleId));

        const add = [...desired].filter((grant) => !current.has(grant));

        const remove = [...current].filter((grant) => !desired.has(grant));

        await this.roleRepo.addGrants(roleId, add);

        await this.roleRepo.removeGrants(roleId, remove);

        if (add.length > 0 || remove.length > 0) {
          changed = true;

          notes.push(`${definition.name}: +${add.length} / -${remove.length} permissions.`);
        }

        if (existing === null) {
          created++;
        } else if (changed) {
          updated++;
        } else {
          skipped++;
        }
      }

      return { created, updated, skipped, notes };
    });
  }
}
