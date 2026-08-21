import { Injectable } from '@nestjs/common';
import {
  VerificationCodeStatus,
  type IdentifierType,
  type VerificationCode,
  type VerificationPurpose,
} from '@prisma/client';

import { PrismaService } from '#/infrastructure/database/prisma/index.js'; // value import — required for DI metadata

import { VERIFICATION_CODE_TTL_MS } from '../constants/index.js';
import type { IssueVerificationCodeInput } from '../interfaces/index.js';
import { normalizeIdentifier } from '../utils/index.js';

/**
 * Every way this application touches `verification_codes` — the short-lived
 * proof that someone can receive mail at an address or messages at a number.
 *
 * ---------------------------------------------------------------------------
 * APPEND-ONLY
 * ---------------------------------------------------------------------------
 * Nothing here deletes and nothing overwrites a live code. Issuing inserts a
 * row; every other method moves a row out of `ACTIVE` and leaves it in place.
 * What accumulates is the history of what was sent to an identifier and how
 * each code ended — the record that answers "did this person actually receive
 * something, and did someone sit there guessing".
 *
 * `status` carries the ending rather than a `deletedAt` timestamp because the
 * four endings are not interchangeable: `CONSUMED` (used), `SUPERSEDED`
 * (replaced by a resend), `BLOCKED` (guessed at until the ceiling) and
 * `EXPIRED` (ran out of time) are four different stories about the same row,
 * and a single "gone" flag would force every reader to re-derive them from
 * `attempts` and `expiresAt` — an inference that silently reclassifies old
 * rows the day `VERIFICATION_CODE_MAX_ATTEMPTS` changes.
 *
 * ---------------------------------------------------------------------------
 * AT MOST ONE LIVE CODE
 * ---------------------------------------------------------------------------
 * Enforced in the database by `verification_codes_active_key`, a unique index
 * over `(identifier_value, identifier_type, purpose)` with the predicate
 * `WHERE status = 'ACTIVE'`. Partial indexes have no Prisma schema syntax, so
 * it lives in the migration — the constraint is real even though the schema
 * cannot show it, which is why `findActive` is a `findFirst` rather than a
 * `findUnique`.
 *
 * `retireActive` is what keeps that constraint satisfiable: it runs before
 * every insert, so an expired row can never sit in `ACTIVE` holding the slot.
 * That also removes the need for a background sweeper — the table heals itself
 * on the next write to the identifier, and nothing is left waiting on a cron
 * this service does not have.
 *
 * ---------------------------------------------------------------------------
 * NORMALISATION
 * ---------------------------------------------------------------------------
 * Like `UserIdentityRepository`, every method normalises the identifier before
 * touching the database. A code issued for `Bob@X.com` has to be found when
 * verifying `bob@x.com`, and the index compares bytes.
 */
@Injectable()
export class VerificationCodeRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retires whatever code is currently live for this identifier and purpose.
   *
   * Two statements rather than one because the ending differs by row and
   * `updateMany` cannot branch: a code already past its expiry ended by
   * running out of time, and one still inside its window ended because a newer
   * code replaced it. Collapsing both into one status would lose exactly the
   * distinction the history exists to record — a resend and a lapse look
   * identical afterwards.
   *
   * The second statement needs no `expiresAt` filter: the first has already
   * taken every expired row out of `ACTIVE`, so whatever remains is live.
   *
   * At most one row is touched in total, and both statements seek the partial
   * unique index. Callers are expected to run this and the insert inside one
   * transaction — see `VerificationCodeService.issue`.
   */
  async retireActive(
    identifierType: IdentifierType,
    identifierValue: string,
    purpose: VerificationPurpose,
  ): Promise<void> {
    const now = new Date();

    const live = {
      identifierValue: normalizeIdentifier(identifierType, identifierValue),
      identifierType,
      purpose,
      status: VerificationCodeStatus.ACTIVE,
    };

    await this.prisma.db.verificationCode.updateMany({
      where: { ...live, expiresAt: { lte: now } },
      data: { status: VerificationCodeStatus.EXPIRED, resolvedAt: now, codeHash: null },
    });

    await this.prisma.db.verificationCode.updateMany({
      where: live,
      data: { status: VerificationCodeStatus.SUPERSEDED, resolvedAt: now, codeHash: null },
    });
  }

  /**
   * Inserts a new live code.
   *
   * `expiresAt` is computed here rather than accepted, so one TTL constant
   * governs every call site. `status` and `attempts` fall to their schema
   * defaults — a code that arrived already blocked, or already half spent,
   * is not a state any caller should be able to construct.
   */
  async create(input: IssueVerificationCodeInput): Promise<VerificationCode> {
    return this.prisma.db.verificationCode.create({
      data: {
        identifierValue: normalizeIdentifier(input.identifierType, input.identifierValue),
        identifierType: input.identifierType,
        purpose: input.purpose,
        codeHash: input.codeHash,
        expiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
      },
    });
  }

  /**
   * The live code for this identifier and purpose, if there is one.
   *
   * `findFirst` because the uniqueness that makes this a single row is a
   * partial index the Prisma schema cannot declare, so no generated
   * `findUnique` covers it. The ordering is belt and braces — the index
   * guarantees one match — and costs nothing at that row count.
   *
   * Retired rows are invisible here by construction: the `status` filter is
   * the whole point, and every other method leaves rows behind rather than
   * removing them.
   */
  async findActive(
    identifierType: IdentifierType,
    identifierValue: string,
    purpose: VerificationPurpose,
  ): Promise<VerificationCode | null> {
    return this.prisma.db.verificationCode.findFirst({
      where: {
        identifierValue: normalizeIdentifier(identifierType, identifierValue),
        identifierType,
        purpose,
        status: VerificationCodeStatus.ACTIVE,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Records a wrong guess, and retires the code if that guess was the last one
   * it had. Returns whether the code is now blocked.
   *
   * Two statements, and the order matters. The increment lands first and
   * unconditionally, so a guess is counted even if the block below fails; the
   * block then matches only if the new total reached the ceiling. Concurrent
   * wrong guesses are safe: both increments are atomic in the database, and
   * whichever block statement runs second matches nothing because the row is
   * no longer `ACTIVE`.
   *
   * `maxAttempts` is a parameter rather than read from the constant here, so
   * the repository states the rule it was given instead of owning a security
   * threshold — that decision belongs to the service.
   */
  async recordFailedAttempt(id: string, maxAttempts: number): Promise<boolean> {
    await this.prisma.db.verificationCode.updateMany({
      where: { id, status: VerificationCodeStatus.ACTIVE },
      data: { attempts: { increment: 1 } },
    });

    const { count } = await this.prisma.db.verificationCode.updateMany({
      where: {
        id,
        status: VerificationCodeStatus.ACTIVE,
        attempts: { gte: maxAttempts },
      },
      data: {
        status: VerificationCodeStatus.BLOCKED,
        resolvedAt: new Date(),
        codeHash: null,
      },
    });

    return count > 0;
  }

  /**
   * Spends the code, and reports whether this call is the one that spent it.
   *
   * This is the single-use guarantee. The `status: ACTIVE` term in the `where`
   * is what makes it a guard rather than a write: two requests racing the same
   * code both run this statement, the database serialises them, and exactly
   * one sees `count === 1`. The loser is told the code is invalid, which it
   * now is.
   *
   * It replaces the delete this used to be. A delete gave the same guarantee
   * by making the row vanish; this keeps the row and the reason it ended.
   */
  async markConsumed(id: string): Promise<boolean> {
    return this.resolve(id, VerificationCodeStatus.CONSUMED);
  }

  /** Retires a code found past its expiry on the read path. */
  async markExpired(id: string): Promise<void> {
    await this.resolve(id, VerificationCodeStatus.EXPIRED);
  }

  /**
   * Retires a code that is already at or over the attempt ceiling.
   *
   * Reachable only when the ceiling is lowered while codes are in flight —
   * `recordFailedAttempt` blocks on the way past it, so under a stable
   * constant no `ACTIVE` row ever sits above the limit.
   */
  async markBlocked(id: string): Promise<void> {
    await this.resolve(id, VerificationCodeStatus.BLOCKED);
  }

  /**
   * The one write shared by every ending: stamp the status, stamp the time,
   * and drop the hash.
   *
   * Guarded on `ACTIVE` so a row can only be resolved once — whatever ended a
   * code is the ending the history keeps, and a later call cannot rewrite it.
   *
   * Clearing `codeHash` is not tidiness. It is an unsalted digest of six
   * digits, so a million-entry table reverses it on a laptop; keeping it after
   * the code is spent would make this history a durable record of every code
   * ever sent. Nothing past this point needs it — who, when, for what, how
   * many guesses and how it ended all survive.
   */
  private async resolve(id: string, status: VerificationCodeStatus): Promise<boolean> {
    const { count } = await this.prisma.db.verificationCode.updateMany({
      where: { id, status: VerificationCodeStatus.ACTIVE },
      data: { status, resolvedAt: new Date(), codeHash: null },
    });

    return count > 0;
  }
}
