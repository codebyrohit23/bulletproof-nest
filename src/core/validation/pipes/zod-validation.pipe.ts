import type { PipeTransform, Type } from '@nestjs/common';
import { createZodValidationPipe } from 'nestjs-zod';

/**
 * The global request validation pipe.
 *
 * Built from the factory rather than used off the shelf for one reason: the
 * stock pipe throws `ZodValidationException`, which extends
 * `BadRequestException`. `ZodExceptionHandler` matches on `instanceof ZodError`,
 * so the stock pipe would never reach it — validation failures would come back
 * as a flat 400 and the field-path logic in that handler would be dead code.
 *
 * Returning the error unchanged lets the raw `ZodError` travel to
 * `GlobalExceptionFilter`, where the existing handler turns it into a 422 with
 * per-field messages.
 *
 * It also keeps the dependency direction clean: `core/exceptions` depends on
 * `zod` (a library) and never on `nestjs-zod` (a framework integration), so
 * replacing the integration later does not touch the error layer.
 *
 * Only parameters typed with a `createZodDto` class are validated — Nest hands
 * the pipe the declared metatype, and a bare `string` or `any` carries no
 * schema. See `shared/pipes/` for the single-param case.
 */
export const ZodValidationPipe: Type<PipeTransform> = createZodValidationPipe({
  /*
   * `ZodExceptionCreator` is typed `(error: unknown) => Error`. A `ZodError`
   * already extends `Error`, so it passes through untouched; the fallback only
   * exists to satisfy the contract for a value that could never occur here.
   */
  createValidationException: (error: unknown): Error =>
    error instanceof Error ? error : new Error('Request validation failed.'),

  /*
   * Left off deliberately.
   *
   * `strictSchemaDeclaration: true` throws a 500 for *any* parameter whose type
   * is not a ZodDto — including `@Param('id') id: string` and `@Req()`. It does
   * guarantee full coverage, but it turns a developer oversight into a runtime
   * production error rather than a build failure, and it forces a DTO class
   * even for a single route parameter.
   *
   * Revisit once every route consistently declares DTOs; until then the gap is
   * closed per route with a params DTO or `shared/pipes/parse-uuid.pipe.ts`.
   */
  strictSchemaDeclaration: false,
});
