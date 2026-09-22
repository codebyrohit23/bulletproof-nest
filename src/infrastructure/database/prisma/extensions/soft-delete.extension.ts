import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

import {
  FILTERABLE_OPERATIONS,
  SOFT_DELETABLE_MODELS,
  SOFT_DELETE_FIELD,
  UNIQUE_READ_OPERATIONS,
} from '../constants/index.js';

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

          if (operation === 'upsert') {
            throw new Error(
              `upsert is not supported on soft-deletable model "${model}"; use find + create/update`,
            );
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
