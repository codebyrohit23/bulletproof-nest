/**
 * Policy for user codes. The code's *shape* is not here — it lives in
 * `shared/constants` because the generator and every DTO must agree on it.
 * These are free to differ from the admin console's.
 */
export const USER_VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;

export const USER_VERIFICATION_CODE_TTL_MINUTES = USER_VERIFICATION_CODE_TTL_MS / 60_000;

export const USER_VERIFICATION_CODE_MAX_ATTEMPTS = 5;

export const USER_VERIFICATION_CODE_MIN_RESEND_INTERVAL_MS = 30 * 1000;
