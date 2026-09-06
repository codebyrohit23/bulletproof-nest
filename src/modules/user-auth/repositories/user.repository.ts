import { Injectable } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import type { User } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

import { LAST_ACTIVE_THROTTLE_MS } from '../constants/index.js';
import type { CreateUserInput } from '../interfaces/index.js';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.db.user.findUnique({ where: { id } });
  }

  async create(input: CreateUserInput): Promise<User> {
    return this.prisma.db.user.create({ data: input });
  }

  /**
   * Brings a self-deactivated account back.
   *
   * Guarded on `DEACTIVATED` rather than written blind, so it can never revive a
   * `SUSPENDED` account: suspension is an administrator's decision, and a user
   * signing back in must not be able to undo it. A no-op return is the correct
   * answer for every other state.
   *
   * Not related to verification. An account is `ACTIVE` from the moment it is
   * created — whether its identifier has been proven is recorded on
   * `user_identities.verified_at`, and that is the only place it lives.
   */
  async reactivate(id: string): Promise<void> {
    await this.prisma.db.user.updateMany({
      where: { id, status: UserStatus.DEACTIVATED },
      data: { status: UserStatus.ACTIVE },
    });
  }

  async touchLastActive(id: string): Promise<void> {
    const staleBefore = new Date(Date.now() - LAST_ACTIVE_THROTTLE_MS);

    await this.prisma.db.user.updateMany({
      where: {
        id,
        OR: [{ lastActiveAt: null }, { lastActiveAt: { lt: staleBefore } }],
      },
      data: { lastActiveAt: new Date() },
    });
  }
}
