import type { CursorPagination, OffsetPagination, Paginated, Pagination } from './pagination.interface.js';

/**
 * Pure builders for pagination. No DI, no database, no HTTP.
 */

export function buildOffsetPagination(total: number, page: number, limit: number): OffsetPagination {
  const safeLimit = Math.max(1, limit);
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));

  return {
    page,
    limit: safeLimit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

/**
 * Cursor pagination has no total, so "is there another page" is answered by
 * over-fetching: the repository asks for `limit + 1` rows, and the presence of
 * the extra row is the answer. `items` must already be trimmed to `limit`.
 */
export function buildCursorPagination(limit: number, nextCursor: string | null): CursorPagination {
  return {
    limit: Math.max(1, limit),
    nextCursor,
    hasNext: nextCursor !== null,
  };
}

/**
 * Assembles the shape a list handler returns.
 *
 * `P` is inferred from the second argument, so the result stays concrete:
 * `paginate(leads, buildOffsetPagination(total, page, limit))` is typed
 * `Paginated<Lead, OffsetPagination>` and `pagination.total` is reachable
 * without narrowing.
 */
export function paginate<T, P extends Pagination>(items: readonly T[], pagination: P): Paginated<T, P> {
  return { items, pagination };
}
