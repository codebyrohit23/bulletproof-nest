/**
 * Pagination contract.
 *
 * Lives in `shared/` rather than `core/interceptors/` because nothing about it is HTTP:
 * a queue processor walking records in batches, a CSV export and an internal
 * sync all paginate with no request involved. Only the *transport* of these
 * values is HTTP-specific.
 *
 * The query logic — `skip`/`take`, cursor encoding, Prisma arguments — is a
 * persistence concern and lives in `infrastructure/database/prisma/utils/`.
 * Nothing here knows what a database is.
 *
 * Note this is **not** the response envelope's `meta`. Pagination describes the
 * data, so it travels inside `data` alongside the items it belongs to; `meta`
 * describes the response itself (request id, timestamp, path).
 *
 * There is no `strategy` discriminator. A route uses one strategy for its
 * lifetime and both sides know which from the contract, so a field restating it
 * on every response would be noise. The shapes are distinguishable anyway —
 * offset carries `page`/`total`, cursor carries `nextCursor`.
 */

/**
 * Page-number pagination. Exposes a total, so the client can render "page 3 of
 * 47" — at the cost of a COUNT on every request.
 */
export interface OffsetPagination {
  readonly page: number;

  readonly limit: number;

  readonly total: number;

  readonly totalPages: number;

  readonly hasNext: boolean;

  readonly hasPrevious: boolean;
}

/**
 * Keyset pagination. No total and no page numbers, but stable under concurrent
 * inserts and cheap at any depth — the right choice for feeds and long lists.
 */
export interface CursorPagination {
  readonly limit: number;

  readonly nextCursor: string | null;

  readonly hasNext: boolean;
}

export type Pagination = OffsetPagination | CursorPagination;

/**
 * What a list endpoint returns.
 *
 * The controller returns this shape directly and it becomes `data` untouched —
 * the response interceptor does no mapping.
 *
 * `P` defaults to the union but is inferred concretely in practice:
 * `paginate(leads, buildOffsetPagination(...))` is typed
 * `Paginated<Lead, OffsetPagination>`, so callers reach `pagination.total`
 * with no narrowing. That is what the discriminator would otherwise have been
 * needed for.
 */
export interface Paginated<T, P extends Pagination = Pagination> {
  readonly items: readonly T[];

  readonly pagination: P;
}
