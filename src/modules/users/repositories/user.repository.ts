import { Injectable } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js';

import { LAST_ACTIVE_THROTTLE_MS } from '../constants/index.js';
import type { CreateUserInput, UpdateUserInput, UserSnapshot } from '../interfaces/index.js';
import { toUserSnapshot } from '../utils/index.js';

const USER_SNAPSHOT_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  displayName: true,
  avatarFileId: true,
  status: true,
} as const satisfies Prisma.UserSelect;

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findSnapshotById(id: string): Promise<UserSnapshot | null> {
    const user = await this.prisma.db.user.findUnique({
      where: { id },
      select: USER_SNAPSHOT_SELECT,
    });

    return user === null ? null : toUserSnapshot(user);
  }

  async create(input: CreateUserInput): Promise<User> {
    return this.prisma.db.user.create({ data: input });
  }

  async update(id: string, input: UpdateUserInput): Promise<UserSnapshot> {
    const user = await this.prisma.db.user.update({
      where: { id },
      data: input,
      select: USER_SNAPSHOT_SELECT,
    });

    return toUserSnapshot(user);
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
