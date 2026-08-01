/**
 * Request validation — the input half of the API contract.
 *
 * Owns: the global Zod pipe, and the unknown-key policy for bodies vs queries.
 *
 * Does NOT own:
 *   error formatting  → core/exceptions   (ZodExceptionHandler already maps
 *                                          ZodError to 422 with field paths)
 *   response shape    → core/interceptors
 *   domain schemas    → modules/<feature>/dto/
 *   shared primitives → shared/validators/ (a job validating a payload needs
 *                                          them too, and must not import HTTP)
 *
 * ---------------------------------------------------------------------------
 * HOW TO USE IT
 * ---------------------------------------------------------------------------
 *   // modules/leads/dto/create-lead.dto.ts
 *   export const createLeadSchema = requestObject({
 *     title: z.string().min(1).max(200),
 *     ownerId: z.uuid(),
 *   });
 *   export class CreateLeadDto extends createZodDto(createLeadSchema) {}
 *
 *   // controller — already validated and typed
 *   create(@Body() dto: CreateLeadDto) {}
 *
 * `createZodDto` produces a class, and that matters: Nest hands the pipe the
 * declared metatype, and a bare TypeScript type is erased at runtime. The class
 * is also what `@nestjs/swagger` introspects, so OpenAPI generation depends on
 * it. Passing a schema inline to the pipe works but produces no documentation.
 *
 * ---------------------------------------------------------------------------
 * KNOWN GAP — a global pipe does not mean everything is validated
 * ---------------------------------------------------------------------------
 * Only parameters declared with a ZodDto carry a schema:
 *
 *   @Body() dto: CreateLeadDto      validated
 *   @Body() body: any               passes straight through
 *   @Param('id') id: string         passes straight through
 *
 * That last one reaches a Prisma `where` clause unchecked. Prisma throws on a
 * malformed UUID, so it is not an injection risk — but the caller gets a 500
 * from the Prisma handler instead of a clean 422. Fix per route with either a
 * params DTO or `shared/pipes/parse-uuid.pipe.ts`.
 *
 * ---------------------------------------------------------------------------
 * PLANNED — deliberately not built yet
 * ---------------------------------------------------------------------------
 *   error-map/validation.error-map.ts      WITH i18n
 *     Zod's defaults read like developer messages ("Invalid input: expected
 *     string"). A custom map producing customer-facing copy needs the caller's
 *     locale, which means injecting RequestContextService — the reason this
 *     module is registered with DI rather than in bootstrap.
 *
 *   pipes/zod-serializer.interceptor      NOT PLANNED
 *     nestjs-zod can validate responses too. Each module's `mappers/` already
 *     builds responses field by field, which is the same guarantee from a
 *     single source of truth. Two would drift.
 */

export { ValidationModule } from './validation.module.js';

export { queryObject, requestObject } from './helpers/request-schema.helper.js';
