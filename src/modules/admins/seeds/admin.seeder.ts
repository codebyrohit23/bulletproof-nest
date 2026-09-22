import { Injectable } from '@nestjs/common';

import { SeedConfigService } from '#/config/seed/index.js';
import { SEED_KIND, Seeder, type SeedKind, type SeedResult } from '#/core/seeding/index.js';
import { TransactionService } from '#/infrastructure/database/prisma/index.js';

import { AdminService } from '../services/admin.service.js';

@Injectable()
export class AdminSeeder extends Seeder {
  readonly key = 'admins';

  readonly kind: SeedKind = SEED_KIND.BOOTSTRAP;

  readonly description = 'The first admin, created without a password.';

  constructor(
    private readonly adminService: AdminService,
    private readonly seedConfig: SeedConfigService,
    private readonly transaction: TransactionService,
  ) {
    super();
  }

  async run(): Promise<SeedResult> {
    const email = this.seedConfig.adminEmail;

    if (email === undefined) {
      return {
        created: 0,
        updated: 0,
        skipped: 1,
        notes: ['SEED_ADMIN_EMAIL is not set — no admin was created.'],
      };
    }

    return this.transaction.run(async () => {
      await this.adminService.lockBootstrap();

      if (await this.adminService.hasAny()) {
        return {
          created: 0,
          updated: 0,
          skipped: 1,
          notes: ['An admin already exists — nothing to create.'],
        };
      }

      const name = this.seedConfig.adminName;

      const admin = await this.adminService.createAdmin({
        email,
        firstName: name,
        displayName: name,
      });

      return {
        created: 1,
        updated: 0,
        skipped: 0,
        notes: [
          `Created ${admin.email} with no password.`,
          'Claim it from the admin console with "Forgot password" — that sets the password and verifies the email.',
        ],
      };
    });
  }
}
