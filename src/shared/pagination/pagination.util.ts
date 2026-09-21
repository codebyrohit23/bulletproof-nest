import type {
  CursorPagination,
  OffsetPagination,
  Paginated,
  Pagination,
} from './pagination.interface.js';

export function buildOffsetPagination(
  total: number,
  page: number,
  limit: number,
): OffsetPagination {
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

export function buildCursorPagination(limit: number, nextCursor: string | null): CursorPagination {
  return {
    limit: Math.max(1, limit),
    nextCursor,
    hasNext: nextCursor !== null,
  };
}

export function paginate<T, P extends Pagination>(
  items: readonly T[],
  pagination: P,
): Paginated<T, P> {
  return { items, pagination };
}
