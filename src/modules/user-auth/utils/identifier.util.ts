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
 */
export function normalizeIdentifier(identifierType: IdentifierType, identifierValue: string): string {
  return identifierType === IdentifierType.EMAIL ? normalizeEmail(identifierValue) : normalizePhone(identifierValue);
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
