import { z } from 'zod';

import { PAGINATION_DEFAULTS, SORT_ORDER } from './pagination.constants.js';

/**
 * Reusable query schemas. Every list endpoint composes one of these rather
 * than redeclaring `page` and `limit`, so the ceiling is enforced in one place.
 *
 * Values arrive as strings, hence `coerce` — but `limit` is clamped by `max()`,
 * never silently truncated, so an over-limit request fails loudly instead of
 * quietly returning fewer rows than asked for.
 */

export const offsetPaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(PAGINATION_DEFAULTS.PAGE),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION_DEFAULTS.MAX_LIMIT)
    .default(PAGINATION_DEFAULTS.LIMIT),
});

export const cursorPaginationSchema = z.object({
  cursor: z.string().min(1).optional(),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION_DEFAULTS.MAX_LIMIT)
    .default(PAGINATION_DEFAULTS.LIMIT),
});

/**
 * Sorting is deliberately not part of the pagination schemas.
 *
 * `sortBy` must be constrained to the columns a given resource actually allows
 * — an open string reaching an ORM `orderBy` is an injection surface and a
 * guaranteed full table scan. Each module builds its own with an enum of its
 * sortable fields, then merges this in.
 */
export const sortOrderSchema = z.enum([SORT_ORDER.ASC, SORT_ORDER.DESC]).default(SORT_ORDER.DESC);

export type OffsetPaginationQuery = z.infer<typeof offsetPaginationSchema>;

export type CursorPaginationQuery = z.infer<typeof cursorPaginationSchema>;
