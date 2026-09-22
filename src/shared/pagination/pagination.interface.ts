import type { z } from 'zod';

import type { offsetPaginationMetaSchema } from './pagination.schema.js';

export type OffsetPagination = Readonly<z.infer<typeof offsetPaginationMetaSchema>>;
export interface CursorPagination {
  readonly limit: number;

  readonly nextCursor: string | null;

  readonly hasNext: boolean;
}

export type Pagination = OffsetPagination | CursorPagination;

export interface OffsetSlice<T> {
  readonly rows: readonly T[];

  readonly total: number;
}
export interface Paginated<T, P extends Pagination = Pagination> {
  readonly items: readonly T[];

  readonly pagination: P;
}
