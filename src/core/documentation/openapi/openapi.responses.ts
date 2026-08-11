import { HttpStatus, applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';

import { ERROR_RESPONSE_SCHEMA } from './openapi.schemas.js';

/**
 * Shared error documentation, so a controller never redescribes the envelope.
 *
 * Without this, every endpoint spells out its own `@ApiUnauthorizedResponse`
 * with its own ad-hoc example. Fifty endpoints in, they disagree, and the
 * reference stops being something a client developer can trust — which is worse
 * than having no reference, because now they trust it and are wrong.
 */

/**
 * The failures a client can be told about, with the wording used for each.
 *
 * Only statuses this application actually produces. A documented `429` with no
 * rate limiter behind it is a promise the API does not keep.
 */
const ERROR_DESCRIPTION = {
  [HttpStatus.BAD_REQUEST]: 'The request was malformed.',
  [HttpStatus.UNAUTHORIZED]: 'No access token was supplied, or it was expired or invalid.',
  [HttpStatus.FORBIDDEN]: 'Authenticated, but not permitted to perform this action.',
  [HttpStatus.NOT_FOUND]: 'No such resource, or it is not visible to this workspace.',
  [HttpStatus.CONFLICT]: 'The request conflicts with the current state of the resource.',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'The request body failed validation. See `validationErrors`.',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred. Quote `meta.requestId` when reporting it.',
} as const;

export type DocumentedErrorStatus = keyof typeof ERROR_DESCRIPTION;

/**
 * Documents the given failures on an endpoint, plus `500`.
 *
 * Statuses are listed explicitly rather than applied wholesale, because a `404`
 * documented on an endpoint that cannot produce one is a lie the reader has no
 * way to detect. `500` is added to every endpoint because the global exception
 * filter genuinely can return it from anywhere.
 *
 * @example
 * ```ts
 * @Get(':id')
 * @ApiErrorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.NOT_FOUND)
 * findOne(@Param('id') id: string) {}
 * ```
 */
export function ApiErrorResponses(...statuses: DocumentedErrorStatus[]): MethodDecorator & ClassDecorator {
  const documented = new Set<DocumentedErrorStatus>([...statuses, HttpStatus.INTERNAL_SERVER_ERROR]);

  return applyDecorators(
    ...[...documented].map((status) =>
      ApiResponse({
        status,
        description: ERROR_DESCRIPTION[status],
        schema: ERROR_RESPONSE_SCHEMA,
      }),
    ),
  );
}

/**
 * The two failures every authenticated endpoint shares.
 *
 * A shorthand rather than a separate concept — it expands to `ApiErrorResponses`
 * and can be combined with it, so an authenticated endpoint that also returns
 * `404` writes both and gets the union.
 */
export function ApiAuthErrorResponses(): MethodDecorator & ClassDecorator {
  return ApiErrorResponses(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
}
