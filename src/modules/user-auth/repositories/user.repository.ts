import { Injectable } from '@nestjs/common';
import { UserState } from '@prisma/client';
import type { User } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js'; // value import — required for DI metadata

import { LAST_ACTIVE_THROTTLE_MS } from '../constants/index.js';
import type { CreateUserInput } from '../interfaces/index.js';

/**
 * Every way this application touches the `users` table.
 *
 * The method list is the contract: four methods, because authentication needs
 * four. A fifth is the moment to ask which index serves it. Anything shaped
 * like `findOne(filter)` is deliberately absent — a caller-supplied filter
 * carries Prisma's query language into the service layer, cannot be checked
 * against an index, and gives the repository no way to enforce an invariant.
 *
 * Reads go through `prisma.db`, which returns the ambient transaction client
 * when one is open and the root client otherwise. That is why no method here
 * takes a transaction parameter: a caller wrapping several repositories in
 * `TransactionService.run` gets one transaction without any of them being told.
 *
 * Email and phone are **not** here — an identifier lives in `user_identities`,
 * so `findByEmail` belongs to that repository.
 */
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Soft-deleted users are invisible: the soft-delete extension fetches the row
   * and discards it when `deletedAt` is set. Repeating that filter here would
   * duplicate a guarantee that already holds.
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.db.user.findUnique({ where: { id } });
  }

  async create(input: CreateUserInput): Promise<User> {
    return this.prisma.db.user.create({ data: input });
  }

  /**
   * Rewrites the profile of an account that has not been verified yet.
   *
   * Guarded on `PENDING` for the same reason `activate` is: without it, this is
   * "change any user's name given their id", reachable from an unauthenticated
   * registration endpoint. Someone re-registering an address that belongs to an
   * active user could rename them.
   *
   * `updateMany` because matching nothing is a legitimate outcome — the account
   * was verified between the caller's check and this write — and the caller
   * treats it as such rather than as an error.
   */
  async updatePendingProfile(id: string, input: CreateUserInput): Promise<void> {
    await this.prisma.db.user.updateMany({
      where: { id, state: UserState.PENDING },
      data: input,
    });
  }

  /**
   * Promotes a pending account once an identity has been proven.
   *
   * Guarded on `PENDING`, and that guard is load-bearing. The obvious
   * `update({ where: { id }, data: { state: ACTIVE } })` would silently
   * reinstate a user suspended for abuse the moment they verify a new email
   * address — a privilege restoration triggered by an ordinary user action.
   *
   * `updateMany` rather than `update` because matching nothing is the expected
   * outcome for an already-active account, not an error.
   */
  async activate(id: string): Promise<void> {
    await this.prisma.db.user.updateMany({
      where: { id, state: UserState.PENDING },
      data: { state: UserState.ACTIVE },
    });
  }

  /**
   * Records that the user did something, at most once per throttle window.
   *
   * The unguarded version writes a row on every authenticated request, which at
   * any real traffic makes this the heaviest write in the system for a column
   * nobody reads in real time. The staleness check keeps it to one round trip
   * while skipping the write almost every time.
   */
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
