import { Injectable } from '@nestjs/common';
import { OutboxStatus, Prisma } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

import { OUTBOX_LAST_ERROR_MAX_LENGTH, OUTBOX_RELAY } from '../constants/index.js';
import type {
  AddedOutboxEntry,
  ClaimedOutboxEntry,
  ClaimedOutboxRow,
  NewOutboxEntry,
  OutboxBacklog,
  OutboxBacklogRow,
} from '../interfaces/index.js';

@Injectable()
export class OutboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(entry: NewOutboxEntry): Promise<AddedOutboxEntry> {
    const [created] = await this.prisma.db.outboxMessage.createManyAndReturn({
      data: [
        {
          queue: entry.queue,
          jobName: entry.jobName,
          payload: entry.payload,
          idempotencyKey: entry.idempotencyKey,
          availableAt: new Date(Date.now() + OUTBOX_RELAY.FAST_PATH_GRACE_MS),
          ...(entry.options !== undefined ? { options: entry.options } : {}),
          ...(entry.expiresAt !== undefined ? { expiresAt: entry.expiresAt } : {}),
        },
      ],
      skipDuplicates: true,
      select: { id: true },
    });

    if (created !== undefined) {
      return { id: created.id, created: true };
    }

    const { id } = await this.prisma.db.outboxMessage.findUniqueOrThrow({
      where: { idempotencyKey: entry.idempotencyKey },
      select: { id: true },
    });

    return { id, created: false };
  }

  async claimDue(limit: number, leaseMs: number): Promise<ClaimedOutboxEntry[]> {
    const rows = await this.prisma.db.$queryRaw<ClaimedOutboxRow[]>`
      UPDATE "outbox_messages"
      SET "available_at" = now() + (${leaseMs}::integer * interval '1 millisecond')
      WHERE "id" IN (
        SELECT "id" FROM "outbox_messages"
        WHERE "status" = 'PENDING' AND "available_at" <= now()
        ORDER BY "available_at"
        LIMIT ${limit}::integer
        FOR UPDATE SKIP LOCKED
      )
      RETURNING "id", "queue", "job_name", "payload", "options",
                "idempotency_key", "attempts", "expires_at"`;

    return rows.map((row) => ({
      id: row.id,
      queue: row.queue,
      jobName: row.job_name,
      payload: row.payload,
      options: row.options,
      idempotencyKey: row.idempotency_key,
      attempts: row.attempts,
      expiresAt: row.expires_at,
    }));
  }

  async markDispatched(id: string): Promise<boolean> {
    return this.finish(id, OutboxStatus.DISPATCHED, { dispatchedAt: new Date() });
  }

  async markExpired(id: string): Promise<boolean> {
    return this.finish(id, OutboxStatus.EXPIRED);
  }

  async markFailed(id: string, error: string): Promise<boolean> {
    return this.finish(id, OutboxStatus.FAILED, {
      lastError: error.slice(0, OUTBOX_LAST_ERROR_MAX_LENGTH),
      attempts: { increment: 1 },
    });
  }

  async reschedule(id: string, delayMs: number, error: string): Promise<boolean> {
    const { count } = await this.prisma.db.outboxMessage.updateMany({
      where: { id, status: OutboxStatus.PENDING },
      data: {
        attempts: { increment: 1 },
        availableAt: new Date(Date.now() + delayMs),
        lastError: error.slice(0, OUTBOX_LAST_ERROR_MAX_LENGTH),
      },
    });

    return count > 0;
  }

  async purgeFinishedBefore(cutoff: Date, limit: number): Promise<number> {
    return this.prisma.db.$executeRaw`
      DELETE FROM "outbox_messages"
      WHERE "id" IN (
        SELECT "id" FROM "outbox_messages"
        WHERE "status" <> 'PENDING' AND "created_at" < ${cutoff}
        LIMIT ${limit}::integer
      )`;
  }

  /**
   * One pass over what is left in the table: finished rows are purged after a
   * day, so this stays small, and the pending ones sit in a partial index.
   */
  async backlog(): Promise<OutboxBacklog> {
    const [row] = await this.prisma.db.$queryRaw<OutboxBacklogRow[]>`
      SELECT
        count(*) FILTER (WHERE "status" = 'PENDING')::integer AS "pending",
        COALESCE(
          EXTRACT(EPOCH FROM now() - min("created_at") FILTER (WHERE "status" = 'PENDING')),
          0
        )::integer AS "oldest_pending_seconds",
        count(*) FILTER (WHERE "status" = 'FAILED')::integer AS "failed"
      FROM "outbox_messages"
      WHERE "status" IN ('PENDING', 'FAILED')`;

    return {
      pending: row?.pending ?? 0,
      oldestPendingSeconds: row?.oldest_pending_seconds ?? 0,
      failedInLastDay: row?.failed ?? 0,
    };
  }

  private async finish(
    id: string,
    status: OutboxStatus,
    data: Prisma.OutboxMessageUpdateManyMutationInput = {},
  ): Promise<boolean> {
    const { count } = await this.prisma.db.outboxMessage.updateMany({
      where: { id, status: OutboxStatus.PENDING },
      data: { ...data, status, payload: Prisma.DbNull },
    });

    return count > 0;
  }
}
