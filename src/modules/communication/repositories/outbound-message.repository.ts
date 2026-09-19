import { Injectable } from '@nestjs/common';
import type { MessageStatus, Prisma } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

@Injectable()
export class OutboundMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Uses `prisma.db`, so a record written during a request joins that request's
   * transaction and disappears with it on rollback.
   *
   * Returns `null` when the idempotency key already exists. `ON CONFLICT DO
   * NOTHING` rather than catching the unique violation: inside a transaction
   * Postgres aborts on the first error, and the lookup that follows a caught one
   * would fail along with everything else the request still had to write.
   */
  async insertIfAbsent(data: Prisma.OutboundMessageCreateManyInput): Promise<string | null> {
    const [created] = await this.prisma.db.outboundMessage.createManyAndReturn({
      data: [data],
      skipDuplicates: true,
      select: { id: true },
    });

    return created?.id ?? null;
  }

  async findIdByIdempotencyKey(idempotencyKey: string): Promise<string | null> {
    const existing = await this.prisma.db.outboundMessage.findUnique({
      where: { idempotencyKey },
      select: { id: true },
    });

    return existing?.id ?? null;
  }

  /**
   * Moves the row to `status`, but only from the statuses listed in `from`.
   *
   * One conditional `updateMany` rather than read-then-write: two callers can
   * report an outcome at the same time — a worker and a provider webhook — and
   * a read followed by a write would let the loser overwrite the winner.
   */
  async advance(
    id: string,
    status: MessageStatus,
    from: readonly MessageStatus[],
    data: Prisma.OutboundMessageUncheckedUpdateInput = {},
  ): Promise<boolean> {
    const { count } = await this.prisma.db.outboundMessage.updateMany({
      where: { id, status: { in: [...from] } },
      data: { ...data, status },
    });

    return count > 0;
  }
}
