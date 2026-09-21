import { z } from 'zod';

import { PAGINATION_DEFAULTS, SORT_ORDER } from './pagination.constants.js';

const limitSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(PAGINATION_DEFAULTS.MAX_LIMIT)
  .default(PAGINATION_DEFAULTS.LIMIT)
  .describe(`Items per page. At most ${PAGINATION_DEFAULTS.MAX_LIMIT}.`);

const offsetPaginationQueryShape = {
  page: z.coerce
    .number()
    .int()
    .positive()
    .default(PAGINATION_DEFAULTS.PAGE)
    .describe('1-based page number.'),

  limit: limitSchema,
};

export type OffsetPaginationQuery = z.infer<z.ZodObject<typeof offsetPaginationQueryShape>>;

export function offsetPaginationQuerySchema<T extends z.ZodRawShape = Record<never, never>>(
  filters: T = {} as T,
) {
  return z.object({ ...filters, ...offsetPaginationQueryShape }).refine(
    (query) => {
      const { page, limit } = query as unknown as OffsetPaginationQuery;

      return (page - 1) * limit <= PAGINATION_DEFAULTS.MAX_OFFSET;
    },
    {
      message:
        `Pages deeper than ${PAGINATION_DEFAULTS.MAX_OFFSET} items are not available. ` +
        'Narrow the filters instead.',
      path: ['page'],
    },
  );
}

export const cursorPaginationQuerySchema = z.object({
  cursor: z.string().min(1).optional(),

  limit: limitSchema,
});

export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;

export const sortOrderSchema = z.enum([SORT_ORDER.ASC, SORT_ORDER.DESC]).default(SORT_ORDER.DESC);

export const offsetPaginationMetaSchema = z.object({
  page: z.number().int().positive(),

  limit: z.number().int().positive(),

  total: z.number().int().nonnegative().describe('Matching items across every page.'),

  totalPages: z
    .number()
    .int()
    .positive()
    .describe('At least 1 — an empty list is page 1 of 1, not page 1 of 0.'),

  hasNext: z.boolean(),

  hasPrevious: z.boolean(),
});

/**
 * `items` is readonly to match `Paginated`, so a service typed with the
 * inferred page type can return `paginate(…)` directly — and any other drift
 * between the two shapes is a compile error at every list endpoint.
 */
export function offsetPageSchema<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item).readonly(),

    pagination: offsetPaginationMetaSchema,
  });
}
