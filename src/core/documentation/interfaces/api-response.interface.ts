import type { HttpStatus, Type } from '@nestjs/common';
import type { ZodDto } from 'nestjs-zod';

import type { ERROR_DESCRIPTION } from '../openapi/openapi.constants.js';

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
 * The failures `ApiErrorResponses` knows how to describe.
 *
 * Derived from the descriptions rather than listed again, so a status can never
 * be accepted by the decorator without having a sentence to show for it.
 */
export type DocumentedErrorStatus = keyof typeof ERROR_DESCRIPTION;
