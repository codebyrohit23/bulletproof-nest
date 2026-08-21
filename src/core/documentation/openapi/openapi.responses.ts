import { HttpStatus, type Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { type ZodDto, ZodSerializerDto } from 'nestjs-zod';

import { ERROR_RESPONSE_SCHEMA, SUCCESS_RESPONSE_SCHEMA } from './openapi.schemas.js';

/**
 * Shared response documentation, so a controller never redescribes the envelope.
 *
 * Without this, every endpoint spells out its own `@ApiUnauthorizedResponse`
 * with its own ad-hoc example. Fifty endpoints in, they disagree, and the
 * reference stops being something a client developer can trust — which is worse
 * than having no reference, because now they trust it and are wrong.
 */

/**
 * A response DTO: a `createZodDto` class.
 *
 * The intersection is not redundant. `ZodSerializerDto` needs the `ZodDto`
 * half — the schema it parses against — while `getSchemaPath` and
 * `ApiExtraModels` need the `Type` half, because `@nestjs/swagger` identifies a
 * model by its constructor. A class produced by `createZodDto` satisfies both,
 * and requiring both here is what stops a bare Zod schema or a plain class from
 * being passed to a decorator that would silently document nothing.
 */
export type ResponseDto = ZodDto & Type<unknown>;

export interface ApiSuccessResponseOptions {
  /**
   * Must match the status the handler actually returns — `201` for a `@Post`
   * that creates, `200` for one that does not.
   *
   * Required rather than defaulted, because a default is silently wrong exactly
   * where it matters: a `@Post` documented as `200` looks correct in review and
   * sends every client to the wrong branch.
   */
  readonly status: HttpStatus;

  /** What this response means for *this* endpoint. "Account created.", not "Success." */
  readonly description: string;

  /** The handler returns a collection rather than a single resource. */
  readonly isArray?: boolean;
}

/**
 * Documents an endpoint's success response **and enforces it at runtime**.
 *
 * The two halves are one decorator on purpose. `@ApiResponse` alone is a
 * promise nothing keeps: the day a handler starts returning an extra field,
 * the reference still says it does not, and the leak ships. Attaching
 * `ZodSerializerDto` here means the documented shape *is* the shape — anything
 * the DTO does not name is stripped before it reaches the client, and the same
 * declaration produces both facts.
 *
 * The `allOf` composition is what makes the envelope visible. Documenting the
 * DTO directly, as `@ApiOkResponse({ type: Dto })` would, describes a body no
 * client ever receives, because `ResponseInterceptor` wraps every return value.
 * Here the endpoint's DTO is grafted onto `data` inside the shared envelope, so
 * the reference shows exactly what comes over the wire.
 *
 * @example
 * ```ts
 * @Post()
 * @ApiSuccessResponse(LeadDto, { status: HttpStatus.CREATED, description: 'Lead created.' })
 * create(@Body() payload: CreateLeadDto) {}
 * ```
 */
export function ApiSuccessResponse(
  type: ResponseDto,
  options: ApiSuccessResponseOptions,
): MethodDecorator {
  const { status, description, isArray = false } = options;

  const reference = { $ref: getSchemaPath(type) };

  return applyDecorators(
    /*
     * The DTO is referenced by `$ref` rather than declared inline, so it is
     * registered as a named component. Without this it never reaches
     * `components.schemas` and the `$ref` above dangles — a reference that
     * renders as an empty box rather than as an error.
     */
    ApiExtraModels(type),

    ZodSerializerDto(type),

    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          SUCCESS_RESPONSE_SCHEMA,
          {
            type: 'object',
            required: ['data'],
            properties: {
              data: isArray ? { type: 'array', items: reference } : reference,
            },
          },
        ],
      },
    }),
  );
}

const ERROR_DESCRIPTION = {
  [HttpStatus.BAD_REQUEST]: 'The request was malformed.',
  [HttpStatus.UNAUTHORIZED]: 'No access token was supplied, or it was expired or invalid.',
  [HttpStatus.FORBIDDEN]: 'Authenticated, but not permitted to perform this action.',
  [HttpStatus.NOT_FOUND]: 'No such resource, or it is not visible to this workspace.',
  [HttpStatus.CONFLICT]: 'The request conflicts with the current state of the resource.',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'The request body failed validation. See `validationErrors`.',
  [HttpStatus.TOO_MANY_REQUESTS]:
    'Too many attempts. Wait, or start the flow again, before retrying.',
  [HttpStatus.INTERNAL_SERVER_ERROR]:
    'An unexpected error occurred. Quote `meta.requestId` when reporting it.',
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
export function ApiErrorResponses(
  ...statuses: DocumentedErrorStatus[]
): MethodDecorator & ClassDecorator {
  const documented = new Set<DocumentedErrorStatus>([
    ...statuses,
    HttpStatus.INTERNAL_SERVER_ERROR,
  ]);

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
