import { Injectable } from '@nestjs/common';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

@Injectable()
export class StorageUsageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async usedBytes(workspaceId: string): Promise<number> {
    const row = await this.prisma.db.workspaceStorageUsage.findUnique({
      where: { workspaceId },
      select: { usedBytes: true },
    });

    return row === null ? 0 : Number(row.usedBytes);
  }

  /**
   * Gives back usage for several workspaces in one statement — a purge batch
   * spans many. Never below zero: if the counter has drifted, a purge that
   * would push it negative must not fail on the check constraint every run.
   */
  async subtract(bytesByWorkspace: ReadonlyMap<string, number>): Promise<void> {
    if (bytesByWorkspace.size === 0) {
      return;
    }

    const workspaceIds = [...bytesByWorkspace.keys()];
    const bytes = [...bytesByWorkspace.values()];

    await this.prisma.db.$executeRaw`
      UPDATE "workspace_storage_usage" AS u
      SET "used_bytes" = GREATEST(u."used_bytes" - d."bytes", 0),
          "updated_at" = now()
      FROM unnest(${workspaceIds}::uuid[], ${bytes}::bigint[]) AS d("workspace_id", "bytes")
      WHERE u."workspace_id" = d."workspace_id"`;
  }

  async adjust(workspaceId: string, deltaBytes: number): Promise<void> {
    await this.prisma.db.workspaceStorageUsage.update({
      where: { workspaceId },
      data: { usedBytes: { increment: deltaBytes } },
    });
  }

  async addWithinQuota(workspaceId: string, bytes: number, quotaBytes: number): Promise<boolean> {
    const rows = await this.prisma.db.$queryRaw<{ used_bytes: bigint }[]>`
      INSERT INTO "workspace_storage_usage" ("workspace_id", "used_bytes", "updated_at")
      SELECT ${workspaceId}::uuid, ${bytes}::bigint, now()
      WHERE ${bytes}::bigint <= ${quotaBytes}::bigint
      ON CONFLICT ("workspace_id") DO UPDATE
        SET "used_bytes" = "workspace_storage_usage"."used_bytes" + EXCLUDED."used_bytes",
            "updated_at" = now()
        WHERE "workspace_storage_usage"."used_bytes" + EXCLUDED."used_bytes" <= ${quotaBytes}::bigint
      RETURNING "used_bytes"`;

    return rows.length === 1;
  }
}
