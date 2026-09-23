/**
 * Policy for admin codes, set apart from the user's so either can move without
 * the other. The code's shape is in `shared/constants`.
 */
export const ADMIN_VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;

export const ADMIN_VERIFICATION_CODE_TTL_MINUTES = ADMIN_VERIFICATION_CODE_TTL_MS / 60_000;

export const ADMIN_VERIFICATION_CODE_MAX_ATTEMPTS = 5;

export const ADMIN_VERIFICATION_CODE_MIN_RESEND_INTERVAL_MS = 30 * 1000;
