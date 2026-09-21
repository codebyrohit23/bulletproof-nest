import type { OffsetPaginationQuery } from '#/shared/pagination/index.js';

export function toOffsetArgs<const O>(query: OffsetPaginationQuery, orderBy: readonly O[]) {
  return {
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    orderBy: [...orderBy, { id: 'desc' as const }],
  };
}
