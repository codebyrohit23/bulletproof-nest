import type { ResponseMeta } from '@/shared/response/index.js';

/**
 * The success half of the API contract.
 *
 * Mirrors `ErrorResponse` in `core/exceptions`: same leading fields, same
 * `meta`, differing only in `data` versus `error`. A client branches on
 * `success` alone and never inspects shape. A field added to one is added to
 * the other in the same commit.
 *
 * `data` is whatever the handler returned, untouched. A list endpoint returns
 * `{ items, pagination }` and that is exactly what appears here — the
 * interceptor never reshapes a payload, so what a controller returns is what a
 * client receives.
 */
export interface SuccessResponse<T = unknown> {
  readonly success: true;

  readonly statusCode: number;

  readonly message: string;

  readonly data: T;

  readonly meta: ResponseMeta;
}
