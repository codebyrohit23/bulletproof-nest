import { IdentifierType } from '@prisma/client';

/**
 * The single definition of what an identifier looks like in storage.
 *
 * `user_identities` enforces uniqueness with a byte comparison, so without this
 * `Bob@x.com` and `bob@x.com` are two accounts for one person — created
 * silently at sign-up by someone whose keyboard capitalised their own name.
 * Phones are worse: `+91 98765 43210`, `+919876543210` and `09876543210` are
 * one number and three rows.
 *
 * Pure, so it can be applied on both sides of the boundary — in the Zod schema
 * at the edge, and again in the repository on every read and write. Applying it
 * twice is harmless; applying it in only one place is how a code path that
 * skips DTO validation writes an unnormalised row.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS IS IN `shared/` RATHER THAN IN A MODULE
 * ---------------------------------------------------------------------------
 * Two tables in two different modules key on an identifier —
 * `user_identities` and `verification_codes` — and they have to agree on the
 * exact bytes, or a code is issued against one spelling of an address and
 * looked up against another. Owning this in either module would force the other
 * to reach across a boundary for a pure string function.
 *
 * `IdentifierType` is a generated enum, not database access, so importing it
 * here does not give this layer knowledge of Prisma in the sense `shared/`
 * forbids.
 */
export function normalizeIdentifier(
  identifierType: IdentifierType,
  identifierValue: string,
): string {
  return identifierType === IdentifierType.EMAIL
    ? normalizeEmail(identifierValue)
    : normalizePhone(identifierValue);
}

/**
 * Lower-cased and trimmed.
 *
 * RFC 5321 makes the local part case-sensitive in principle, so `Bob@x.com` and
 * `bob@x.com` could technically be different mailboxes. No provider in practice
 * treats them that way, and honouring the letter of the spec would mean letting
 * one person hold two accounts they cannot tell apart.
 */
function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Reduced to digits with a leading `+`.
 *
 * Deliberately not a full E.164 conversion: turning `09876543210` into
 * `+919876543210` requires knowing the caller's country, which this function
 * has no way to learn and must not guess — guessing wrong silently attaches an
 * account to a stranger's number in another country.
 *
 * So this canonicalises formatting only. Rejecting a number that is not already
 * E.164 is validation, and belongs to the schema at the edge where a useful
 * error message can be produced.
 */
function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');

  return digits.length === 0 ? '' : `+${digits}`;
}
