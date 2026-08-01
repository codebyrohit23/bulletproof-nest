/**
 * Generic, reusable pipes.
 *
 * Empty by design — nothing here has a consumer until the first controller
 * exists. Documented now so the folder is not a mystery.
 *
 * ---------------------------------------------------------------------------
 * PLANNED
 * ---------------------------------------------------------------------------
 *   parse-uuid.pipe.ts                     WITH the first `:id` route
 *     The global Zod pipe only validates parameters declared with a ZodDto, so
 *     `@Param('id') id: string` reaches a repository unchecked and Prisma
 *     answers a malformed UUID with a 500 rather than a 422.
 *
 *     Implement it by parsing through a one-key object rather than a bare
 *     schema — `z.object({ [name]: z.uuid() })` — so the resulting ZodError
 *     carries the parameter name in `issue.path`. A bare `z.uuid().safeParse()`
 *     produces an empty path, and `ZodExceptionHandler` would report the field
 *     as "body", which is worse than no message.
 *
 *     Throw the raw ZodError, exactly as the global pipe does, so both paths
 *     produce the same 422 shape.
 *
 * ---------------------------------------------------------------------------
 * WHAT DOES NOT BELONG HERE
 * ---------------------------------------------------------------------------
 *   The global validation pipe    → core/validation  (it is application policy,
 *                                   not a reusable primitive)
 *   Anything domain-aware         → modules/<feature>/pipes/
 */

export {};
