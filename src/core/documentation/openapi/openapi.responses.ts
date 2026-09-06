import { HttpStatus, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ZodSerializerDto } from 'nestjs-zod';

import type {
  ApiSuccessResponseOptions,
  DocumentedErrorStatus,
  ResponseDto,
} from '../interfaces/index.js';

import { ERROR_DESCRIPTION } from './openapi.constants.js';
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

/**
 * Documents a success that carries a message and no payload.
 *
 * For endpoints whose whole answer is the sentence — a resend, a sign-out, a
 * "we have emailed you if that address exists". The envelope is returned in
 * full, so a client reads `success`, `message` and `meta` exactly as it does
 * everywhere else; only `data` is `null`.
 *
 * Not `ApiSuccessResponse` with an empty DTO: that documents `data` as `{}`
 * while the wire carries `null`, which is a reference that is confidently wrong
 * — worse than one that says nothing — and attaches a serializer with nothing
 * to serialise.
 *
 * **The handler must return `null`, not `void`.** `ResponseInterceptor` passes
 * an `undefined` payload through untouched, so a `void` handler produces an
 * empty body with no envelope and no message, and the `@ResponseMessage` above
 * it silently does nothing.
 *
 * @example
 * ```ts
 * @Post('verification/resend')
 * @ApiSuccessMessageResponse({ status: HttpStatus.OK, description: 'Code sent if required.' })
 * @ResponseMessage('If the account requires verification, a new code has been sent.')
 * resend(@Body() payload: ResendDto): Promise<null> {}
 * ```
 */
export function ApiSuccessMessageResponse(
  options: Omit<ApiSuccessResponseOptions, 'isArray'>,
): MethodDecorator {
  const { status, description } = options;

  return ApiResponse({
    status,
    description,
    schema: {
      allOf: [
        SUCCESS_RESPONSE_SCHEMA,
        {
          type: 'object',
          required: ['data'],
          properties: {
            data: {
              type: 'null',
              description: 'Always null. This endpoint answers with its message alone.',
            },
          },
        },
      ],
    },
  });
}

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
