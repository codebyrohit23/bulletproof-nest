import { Injectable } from '@nestjs/common';
import type { MessageStatus, Prisma } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

@Injectable()
export class OutboundMessageRepository {
  constructor(private readonly prisma: PrismaService) {}

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
