/**
 * The longest an identifier may be, in characters.
 *
 * 320 is the RFC 5321 ceiling for an email address — 64 for the local part, an
 * `@`, and 255 for the domain. Phone numbers are far shorter and are bounded by
 * `PHONE_E164_PATTERN` instead, so one limit covers both columns and matches
 * `user_identities.identifier_value` and `verification_codes.identifier_value`,
 * which are both `VARCHAR(320)`.
 */
export const IDENTIFIER_MAX_LENGTH = 320;

/**
 * E.164: a leading `+`, a non-zero country code, and at most 15 digits.
 *
 * Enforced at the edge rather than inside the normaliser. Rejecting a number is
 * validation and needs a message the caller can act on; `normalizeIdentifier`
 * only canonicalises formatting and is deliberately unable to fail.
 */
export const PHONE_E164_PATTERN = /^\+[1-9]\d{1,14}$/;
