/**
 * Pagination contract — transport-agnostic and ORM-agnostic.
 *
 * Query logic (`skip`/`take`, cursor encode/decode, Prisma arguments) lives in
 * `infrastructure/database/prisma/utils/` and is built with the first
 * repository that needs it. Nothing here may import Prisma.
 */

export { PAGINATION_DEFAULTS, SORT_ORDER, type SortOrder } from './pagination.constants.js';

export type {
  CursorPagination,
  OffsetPagination,
  Paginated,
  Pagination,
} from './pagination.interface.js';

export {
  cursorPaginationSchema,
  offsetPaginationSchema,
  sortOrderSchema,
  type CursorPaginationQuery,
  type OffsetPaginationQuery,
} from './pagination.schema.js';

export { buildCursorPagination, buildOffsetPagination, paginate } from './pagination.util.js';
