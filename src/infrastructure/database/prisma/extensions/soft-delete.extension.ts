import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import { SOFT_DELETABLE_MODELS, SOFT_DELETE_FIELD } from '../constants/prisma.constants.js';

/**
 * Hides soft-deleted rows from every read.
 *
 * Applies only to the models listed in `SOFT_DELETABLE_MODELS`. A model that is
 * not registered is untouched, so this extension can never break a table that
 * has no `deletedAt` column.
 *
 * Deleting: `delete` and `deleteMany` are intentionally **not** intercepted and
 * still perform a hard delete. Erasure has to stay possible (GDPR, cleanup
 * scripts), and a hard delete is always something a developer typed on purpose.
 * To soft delete, update `deletedAt` — the reads below take care of the rest.
 */

/** Operations whose `where` accepts arbitrary filters — the filter can be injected directly. */
const FILTERABLE_OPERATIONS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'updateMany',
]);

/** Operations whose `where` accepts unique fields only — the result must be filtered instead. */
const UNIQUE_READ_OPERATIONS = new Set(['findUnique', 'findUniqueOrThrow']);

export function createSoftDeleteExtension() {
  return Prisma.defineExtension({
    name: 'soft-delete',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!isSoftDeletable(model)) {
            return query(args);
          }

          if (FILTERABLE_OPERATIONS.has(operation)) {
            return query(withNotDeletedFilter(args));
          }

          if (UNIQUE_READ_OPERATIONS.has(operation)) {
            return handleUniqueRead(operation, args, query);
          }

          return query(args);
        },
      },
    },
  });
}

function isSoftDeletable(model: string | undefined): boolean {
  return model !== undefined && (SOFT_DELETABLE_MODELS as readonly string[]).includes(model);
}

/**
 * Merges `deletedAt: null` into the existing `where`.
 *
 * An explicit `deletedAt` supplied by the caller wins, so a repository can still
 * query the archive deliberately.
 */
function withNotDeletedFilter<TArgs>(args: TArgs): TArgs {
  const query = toRecord(args) ?? {};
  const where = toRecord(query['where']) ?? {};

  if (SOFT_DELETE_FIELD in where) {
    return args;
  }

  return {
    ...query,
    where: { ...where, [SOFT_DELETE_FIELD]: null },
  } as TArgs;
}

/**
 * `findUnique` cannot carry a non-unique filter, so the row is fetched and
 * discarded afterwards.
 *
 * When the caller supplied a `select` that omits `deletedAt`, the field is
 * temporarily added so the check is possible, then stripped from the result —
 * otherwise a narrow projection would silently expose deleted rows.
 */
async function handleUniqueRead<TArgs>(
  operation: string,
  args: TArgs,
  query: (args: TArgs) => Promise<unknown>,
): Promise<unknown> {
  const original = toRecord(args) ?? {};
  const select = toRecord(original['select']);
  const selectHidesField = select !== undefined && select[SOFT_DELETE_FIELD] !== true;

  const effectiveArgs = (
    selectHidesField ? { ...original, select: { ...select, [SOFT_DELETE_FIELD]: true } } : original
  ) as TArgs;

  const result = await query(effectiveArgs);
  const record = toRecord(result);

  if (record === undefined) {
    return result;
  }

  if (record[SOFT_DELETE_FIELD] != null) {
    if (operation === 'findUniqueOrThrow') {
      throw recordNotFoundError();
    }

    return null;
  }

  if (selectHidesField) {
    const { [SOFT_DELETE_FIELD]: _omitted, ...visible } = record;

    return visible;
  }

  return result;
}

/**
 * Mirrors the error Prisma raises for a missing record so `PrismaExceptionHandler`
 * maps it to 404 exactly as it would for a genuinely absent row.
 */
function recordNotFoundError(): PrismaClientKnownRequestError {
  return new PrismaClientKnownRequestError('No record was found for a query.', {
    code: 'P2025',
    clientVersion: Prisma.prismaVersion.client,
  });
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}
