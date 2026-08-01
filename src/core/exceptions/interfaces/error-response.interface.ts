import type { ResponseMeta } from '@/shared/response/index.js';

import type { ApiError } from './api-error.interface.js';
import type { ValidationError } from './validation-error.interface.js';

/**
 * The error half of the API contract.
 *
 * Mirrors `SuccessResponse` in `core/interceptors`: same leading fields, same `meta`,
 * differing only in `error` versus `data`. `ResponseMeta` is imported rather
 * than redeclared so the two envelopes cannot drift apart.
 */
export interface ErrorResponse {
  readonly success: false;

  readonly statusCode: number;

  readonly message: string;

  readonly error: ApiError;

  readonly validationErrors?: readonly ValidationError[];

  readonly meta: ResponseMeta;
}
