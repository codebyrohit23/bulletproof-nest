/**
 * How this module treats the headers it reads.
 *
 * The header *names* are protocol vocabulary and live in
 * `shared/constants/headers.constants.ts`, because `config/` needs them for
 * CORS and may not import from `core/`. What stays here is the reading policy —
 * defaults, widths and the values this module chooses to distrust — which is
 * nobody else's business.
 */

export const DEFAULT_LOCALE = 'en';

/** Matches `user_sessions.device_id`, so a value that validates can insert. */
export const DEVICE_ID_MAX_LENGTH = 255;

export const GEO_COUNTRY_CODE_LENGTH = 2;

export const GEO_NAME_MAX_LENGTH = 100;

/**
 * Placeholders an edge sends when it could not resolve a country. Treated as
 * absent rather than stored, so a session's origin is either known or null and
 * never a code that looks real.
 */
export const GEO_UNKNOWN_COUNTRY_CODES: readonly string[] = ['XX', 'T1'];

export const CONTEXT_LOG_CONTEXT = 'RequestContext';
