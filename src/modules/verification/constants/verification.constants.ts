export const VERIFICATION_LOG_CONTEXT = 'Verification';

export const VERIFICATION_CODE_PATTERN = /^\d{6}$/;

export const VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;

export const VERIFICATION_CODE_MAX_ATTEMPTS = 5;

/**
 * How long a freshly issued code is left alone before a new request rotates it.
 *
 * Not a rate limit — how often an identifier may be sent a code is a quota, and
 * it lives on the route with the rest of them. This is about a code that is
 * still in flight: issuing supersedes whatever is live, so a second request
 * arriving while the first mail is still in a queue would kill the code the
 * user is about to read and replace it with one they have not received.
 *
 * Deliberately shorter than the client's own resend timer. If the two matched,
 * clock skew would make a legitimate resend land a moment early and be answered
 * with silence — no new mail, and nothing said about why.
 */
export const VERIFICATION_CODE_MIN_RESEND_INTERVAL_MS = 30 * 1000;
