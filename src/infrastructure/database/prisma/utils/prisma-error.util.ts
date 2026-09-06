import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import { PRISMA_ERROR_CODE } from '../constants/prisma.constants.js';

/**
 * Error classification. Pure — no DI, no logging, no queries.
 *
 * These exist so that a Prisma error code never has to travel out of a
 * repository. A service that had to `import { PrismaClientKnownRequestError }`
 * in order to learn whether an insert lost a race would be a service that knows
 * which database it is running on, and keeping that knowledge inside
 * repositories is the whole point of having them.
 *
 * Predicates rather than wrapped error types: the caller still receives the
 * original error, with its stack and its metadata intact, and decides for
 * itself whether the condition means retry, `409`, or nothing at all. Wrapping
 * would force that decision here, one layer too early.
 */

/**
 * Did this write fail because it would have duplicated a unique value?
 *
 * The signal behind an optimistic insert. When a uniqueness rule cannot be
 * checked safely by reading first — because another transaction can always
 * commit between the read and the write — the honest design is to attempt the
 * write and treat the constraint as the arbiter. This is how the attempt
 * reports back.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS DOES NOT DO
 * ---------------------------------------------------------------------------
 * It does not identify *which* constraint was violated. `meta.target` is
 * documented as varying by database, and Prisma populates it inconsistently for
 * indexes it did not create — a partial unique index owned by a migration, for
 * instance. Matching on it would produce a predicate that silently stops
 * matching after an upgrade, which is worse than not matching at all.
 *
 * So a caller on a table with two unique constraints cannot use this to tell
 * them apart, and should not try. Either the operation has one plausible
 * conflict, or the distinction belongs in a query the caller writes itself.
 *
 * ---------------------------------------------------------------------------
 * AND A WARNING ABOUT WHERE IT IS CAUGHT
 * ---------------------------------------------------------------------------
 * Postgres aborts a transaction at its first failed statement; every statement
 * after that fails too, and the eventual `COMMIT` silently becomes a rollback.
 * So this must be caught **outside** `TransactionService.run`, never inside it.
 * Catching within the callback and carrying on looks like it works, and quietly
 * discards the rest of the transaction while its after-commit hooks still fire.
 */
export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof PrismaClientKnownRequestError &&
    error.code === PRISMA_ERROR_CODE.UNIQUE_CONSTRAINT
  );
}
