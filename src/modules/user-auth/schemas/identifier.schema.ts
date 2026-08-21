import { IdentifierType } from '@prisma/client';
import { z } from 'zod';

import { IDENTIFIER_MAX_LENGTH, PHONE_E164_PATTERN } from '../constants/index.js';

/**
 * How a person is addressed — validated and normalised in one pass.
 *
 * ---------------------------------------------------------------------------
 * ORDER MATTERS
 * ---------------------------------------------------------------------------
 * `.trim().toLowerCase().pipe(z.email())` — normalise *first*, then validate.
 *
 * The intuitive spelling, `z.email().trim().toLowerCase()`, is broken: Zod runs
 * transforms **after** validation, so `"  bob@x.com  "` is rejected as a
 * malformed address before the trim it needs ever runs. Mobile keyboards add
 * that space after autocomplete and spreadsheet pastes bring one along, so the
 * failure lands on real users at sign-up.
 *
 * ---------------------------------------------------------------------------
 * WHY A DISCRIMINATED UNION, AND WHY IT IS NESTED
 * ---------------------------------------------------------------------------
 * The two kinds need different rules — lower-casing is right for an address and
 * meaningless for a number, E.164 is right for a number and absurd for an
 * address. A single `value: z.string()` could apply neither, and would happily
 * accept `{ type: 'PHONE', value: 'bob@x.com' }`.
 *
 * It is nested under one key rather than spread across the request because
 * `createZodDto` cannot build a class from a bare union — the base constructor
 * would have a union instance type. Nesting keeps the discriminant, and reads
 * better besides: type and value are one fact that must agree, not two
 * independent fields.
 *
 * This is also why registration is one endpoint rather than two. The branch
 * exists in the type system, so it need not exist in the URL.
 */

export const emailIdentifierSchema = z.object({
  type: z.literal(IdentifierType.EMAIL),

  value: z.string().trim().toLowerCase().pipe(z.email().max(IDENTIFIER_MAX_LENGTH)),
});

export const phoneIdentifierSchema = z.object({
  type: z.literal(IdentifierType.PHONE),

  /**
   * Required to arrive in E.164 already.
   *
   * Deliberately not accepting `09876543210` and converting it: turning a local
   * number into an international one requires knowing the caller's country,
   * which the server cannot know and must not guess. Guessing wrong sends a
   * verification code to a stranger in another country. Rejecting here, where a
   * useful message can be shown, is the honest place to draw the line.
   */
  value: z
    .string()
    .trim()
    .regex(PHONE_E164_PATTERN, 'must be in E.164 format, for example +919876543210'),
});

export const identifierSchema = z.discriminatedUnion('type', [
  emailIdentifierSchema,
  phoneIdentifierSchema,
]);

export type IdentifierInput = z.infer<typeof identifierSchema>;
