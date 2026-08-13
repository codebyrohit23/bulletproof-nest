import { Injectable } from '@nestjs/common';
import type { IdentifierType, UserIdentity } from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js'; // value import — required for DI metadata

import type { CreateIdentityInput } from '../interfaces/index.js';
import { normalizeIdentifier } from '../utils/index.js';

/**
 * Every way this application touches `user_identities` — the table that answers
 * "who is this person, by the address they gave us".
 *
 * **Normalisation is enforced here and nowhere else matters.** Every method
 * that accepts an identifier value runs it through `normalizeIdentifier` before
 * touching the database. The Zod schemas normalise too, at the edge, but a
 * seed, a queue worker or an admin script never sees a DTO — and the row it
 * writes still has to collide with the one a browser wrote, or the uniqueness
 * constraint is decoration.
 *
 * One method takes the identifier *type* rather than there being a
 * `findByEmail` and a `findByPhone`: the query, the table and the index are
 * identical, only the enum value differs, and callers already hold the type as
 * data from the request. Splitting it would push a ternary into every call
 * site to choose between two methods with the same body.
 */
@Injectable()
export class UserIdentityRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Sign-in's first question. Uses the `(identifier_value, identifier_type)`
   * unique index — value first, which is why looking up by identifier alone is
   * a single index seek.
   *
   * Returns the whole row rather than a narrowed `select`, because the caller
   * needs `verifiedAt` to decide whether an unproven account may proceed and
   * `userId` to continue. Selecting only `userId` would force a second query
   * the moment anyone asked the obvious next question.
   */
  async findByIdentifier(identifierType: IdentifierType, identifierValue: string): Promise<UserIdentity | null> {
    return this.prisma.db.userIdentity.findUnique({
      where: {
        identifierValue_identifierType: {
          identifierValue: normalizeIdentifier(identifierType, identifierValue),
          identifierType,
        },
      },
    });
  }

  /**
   * Registration's pre-check, kept separate from `findByIdentifier` so the
   * intent is visible at the call site and no row is read to answer a yes/no.
   *
   * Note what this does *not* imply: a `true` here must never become "this
   * email is taken" in a response. That turns the endpoint into a membership
   * oracle for anyone with a list of addresses.
   */
  async existsByIdentifier(identifierType: IdentifierType, identifierValue: string): Promise<boolean> {
    const found = await this.prisma.db.userIdentity.findUnique({
      where: {
        identifierValue_identifierType: {
          identifierValue: normalizeIdentifier(identifierType, identifierValue),
          identifierType,
        },
      },
      select: { id: true },
    });

    return found !== null;
  }

  /**
   * Every identity a user holds — at most one email and one phone, per the
   * `(user_id, identifier_type)` constraint.
   */
  async findByUserId(userId: string): Promise<UserIdentity[]> {
    return this.prisma.db.userIdentity.findMany({ where: { userId } });
  }

  async create(input: CreateIdentityInput): Promise<UserIdentity> {
    return this.prisma.db.userIdentity.create({
      data: {
        ...input,
        identifierValue: normalizeIdentifier(input.identifierType, input.identifierValue),
      },
    });
  }

  /**
   * Records that possession was proven.
   *
   * Guarded on `verifiedAt: null` so re-verifying does not move the timestamp
   * forward. That date is evidence — of when an address was proven, and of the
   * order things happened in during an incident review — and an idempotent
   * retry must not rewrite it.
   *
   * `updateMany` because matching nothing means "already verified", which is a
   * success for the caller and not an error.
   */
  async markVerified(id: string): Promise<void> {
    await this.prisma.db.userIdentity.updateMany({
      where: { id, verifiedAt: null },
      data: { verifiedAt: new Date() },
    });
  }
}
