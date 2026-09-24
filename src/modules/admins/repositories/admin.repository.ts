import { Injectable } from '@nestjs/common';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';
import { normalizeEmail } from '#/shared/utils/index.js';

import { ADMIN_BOOTSTRAP_LOCK_KEY, ADMIN_SNAPSHOT_SELECT } from '../constants/index.js';
import type { AdminSnapshot, CreateAdminInput } from '../interfaces/index.js';
import { toAdminSnapshot } from '../mappers/index.js';

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSnapshotById(id: string): Promise<AdminSnapshot | null> {
    const admin = await this.prisma.db.admin.findUnique({
      where: { id },
      select: ADMIN_SNAPSHOT_SELECT,
    });

    return admin === null ? null : toAdminSnapshot(admin);
  }

  async findSnapshotByEmail(email: string): Promise<AdminSnapshot | null> {
    const admin = await this.prisma.db.admin.findFirst({
      where: { email: normalizeEmail(email) },
      select: ADMIN_SNAPSHOT_SELECT,
    });

    return admin === null ? null : toAdminSnapshot(admin);
  }

  async create(input: CreateAdminInput): Promise<AdminSnapshot> {
    const admin = await this.prisma.db.admin.create({
      data: { ...input, email: normalizeEmail(input.email) },
      select: ADMIN_SNAPSHOT_SELECT,
    });

    return toAdminSnapshot(admin);
  }

  /** Only the first proof is recorded; a later one does not move the date. */
  async markEmailVerified(id: string): Promise<void> {
    await this.prisma.db.admin.updateMany({
      where: { id, emailVerifiedAt: null },
      data: { emailVerifiedAt: new Date() },
    });
  }

  /** Counts live admins only — the soft-delete extension filters the rest. */
  async count(): Promise<number> {
    return this.prisma.db.admin.count();
  }

  async lockBootstrap(): Promise<void> {
    await this.prisma.db
      .$executeRaw`select pg_advisory_xact_lock(${ADMIN_BOOTSTRAP_LOCK_KEY}::bigint)`;
  }
}
