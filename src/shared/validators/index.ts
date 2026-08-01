/**
 * Reusable Zod schema primitives.
 *
 * Empty by design — no DTO exists yet, so nothing would consume them. Building
 * a library of schemas before there is a caller means guessing at constraints,
 * and the guesses are usually wrong.
 *
 * These live in `shared/` rather than `core/validation/` because they are not
 * HTTP-specific: a BullMQ processor validating a job payload and a seed script
 * checking its input both need them, and neither should import an HTTP module.
 *
 * ---------------------------------------------------------------------------
 * PLANNED — add each when a DTO first needs it
 * ---------------------------------------------------------------------------
 *   id.schema.ts        uuidSchema — v7 ids are stored as `@db.Uuid`, so this
 *                       is `z.uuid()`; do not hand-roll a regex.
 *
 *   contact.schema.ts   emailSchema, phoneSchema. Phone must be E.164
 *                       (`+14155552671`), not free text — the same lead
 *                       arriving from a web form and from WhatsApp has to
 *                       normalise to one value or deduplication silently fails.
 *
 *   text.schema.ts      slugSchema, and trimmed/bounded string helpers. Every
 *                       user-supplied string needs a max length; without one,
 *                       a 2 MB "name" is a valid request.
 *
 * ---------------------------------------------------------------------------
 * WHAT DOES NOT BELONG HERE
 * ---------------------------------------------------------------------------
 *   requestObject / queryObject   → core/validation  (application policy)
 *   Pagination query schemas      → shared/pagination (already built)
 *   Domain schemas                → modules/<feature>/dto/
 */

export {};
