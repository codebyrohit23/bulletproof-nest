import { Injectable } from '@nestjs/common';
import type { AdminCredential } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

@Injectable()
export class AdminCredentialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAdminId(adminId: string): Promise<AdminCredential | null> {
    return this.prisma.db.adminCredential.findUnique({ where: { adminId } });
  }

  /** Upsert, because a seeded admin has no credential row until the first reset. */
  async upsert(adminId: string, passwordHash: string): Promise<AdminCredential> {
    return this.prisma.db.adminCredential.upsert({
      where: { adminId },
      create: { adminId, passwordHash },
      update: { passwordHash, passwordChangedAt: new Date() },
    });
  }

  async rehashPassword(adminId: string, passwordHash: string): Promise<void> {
    await this.prisma.db.adminCredential.update({ where: { adminId }, data: { passwordHash } });
  }
}
