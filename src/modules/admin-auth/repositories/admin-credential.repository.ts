import { Injectable } from '@nestjs/common';
import type { AdminCredential } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

@Injectable()
export class AdminCredentialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByAdminId(adminId: string): Promise<AdminCredential | null> {
    return this.prisma.db.adminCredential.findUnique({ where: { adminId } });
  }

  async rehashPassword(adminId: string, passwordHash: string): Promise<void> {
    await this.prisma.db.adminCredential.update({ where: { adminId }, data: { passwordHash } });
  }
}
