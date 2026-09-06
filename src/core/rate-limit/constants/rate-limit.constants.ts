export const RATE_LIMIT_LOG_CONTEXT = 'RateLimit';

/**
 * Whether a limit is counted per tenant or across the whole installation.
 *
 * The same two markers cache uses, and the same reason for having both — but
 * declared here rather than shared, because each namespace owns its own key
 * layout. A limit and a cache entry happening to spell "tenant" the same way is
 * a coincidence worth keeping cheap to break.
 *
 * Most limits in an auth flow are `GLOBAL`, and not by accident: register,
 * login and password reset all run **before** a workspace has been chosen, so
 * there is no tenant in context to scope them by. Tenant scoping is for quotas
 * a workspace owns — API calls, imports, exports.
 */
export const RATE_LIMIT_SCOPE = {
  TENANT: 'ws',

  GLOBAL: 'global',
} as const;

export const RATE_LIMIT_VERSION_PREFIX = 'v';

/**
 * What a rule wants to happen when the counter cannot be reached.
 *
 * Per rule, never global, because the right answer is genuinely opposite at
 * either end of an application:
 *
 *     ALLOW   an OTP send, a login — refusing these turns a Redis blip into
 *             "nobody can sign up", which is worse than the burst it prevents
 *     DENY    anything that spends money or destroys data — there the limit is
 *             part of the safety, not an optimisation around it
 */
export const RATE_LIMIT_STORE_FAILURE = {
  ALLOW: 'ALLOW',

  DENY: 'DENY',
} as const;

export type RateLimitStoreFailurePolicy =
  (typeof RATE_LIMIT_STORE_FAILURE)[keyof typeof RATE_LIMIT_STORE_FAILURE];

/**
 * `retryAfterSeconds` is reported to humans and to HTTP headers, both of which
 * count in seconds while every rule here is written in milliseconds.
 */
export const RATE_LIMIT_MS_PER_SECOND = 1_000;

export const RATE_LIMIT_METADATA = 'rate-limit:definitions';

export const RATE_LIMIT_SKIP_METADATA = 'rate-limit:skip';

/**
 * Who a route's budget is counted against.
 *
 * ---------------------------------------------------------------------------
 * THE ONLY RULE THAT MATTERS HERE
 * ---------------------------------------------------------------------------
 * A budget is worth exactly as much as its subject is hard to change. Keying an
 * abuse limit on something the caller supplies is not a limit at all — the
 * caller sends a different value and gets a fresh budget, and the counters look
 * healthy the entire time.
 *
 * There used to be a `CLIENT` subject meaning "the device if it sent one, the
 * address otherwise". It was removed rather than documented, because it is
 * exactly the trap: `x-device-id` is an unvalidated request header, so a script
 * that sends a random one per request never reaches the address fallback and is
 * never limited. Choosing between `IP` and `DEVICE` at every call site is the
 * point — the choice is a security decision and should not have a default.
 *
 * There is also deliberately no `USER`. Global guards run *before* route-level
 * ones, so `UserAuthGuard` has not filled in an identity by the time this guard
 * asks. A user-keyed limit would silently degrade to an address, which is worse
 * than not offering it. It arrives when authentication becomes global.
 */
export const RATE_LIMIT_SUBJECT = {
  /**
   * The network address. **The only subject fit for abuse protection**, because
   * it is the only one an attacker cannot change for free.
   *
   * Keep address budgets loose. Fifty colleagues behind one NAT address are one
   * subject, so a budget tight enough to stop a determined script also blocks
   * forty-nine innocent people. The tight budget is the one keyed on the account
   * being acted on; this is the ceiling behind it.
   */
  IP: 'ip',
} as const;

export type RateLimitSubject = (typeof RATE_LIMIT_SUBJECT)[keyof typeof RATE_LIMIT_SUBJECT];

/**
 * Lowercase because Fastify normalises header names, and these are the
 * `RateLimit-*` fields HTTP clients and SDKs already know how to read.
 */
export const RATE_LIMIT_HEADER = {
  LIMIT: 'ratelimit-limit',

  REMAINING: 'ratelimit-remaining',

  RESET: 'ratelimit-reset',
} as const;

export const RATE_LIMIT_DEFAULT_VERSION = 1;

/**
 * Subjects are hashed before they reach a key. Keys turn up in `SCAN`,
 * `MONITOR` and the slowlog, and an address or an email address read off a
 * terminal is a privacy incident that nobody chose.
 */
export const RATE_LIMIT_SUBJECT_DIGEST_LENGTH = 32;

/**
 * The bucket for a request with no address at all. Everything in it shares one
 * counter, which is acceptable only because it should be empty: an HTTP request
 * without a remote address is a misconfigured proxy, and the warning says so.
 */
export const RATE_LIMIT_UNRESOLVED_SUBJECT = 'unresolved';

/**
 * The baseline every HTTP route carries.
 *
 * Not the limit that stops a credential-stuffing run — that is the tight,
 * per-route budget a controller declares with `@RateLimit`. This exists so a
 * route nobody has thought about yet is still not an unbounded one.
 *
 * Loose on purpose. It is keyed on the address, and a whole office behind one
 * NAT address is one subject, so it has to fit an office rather than a browser.
 * Anything tighter belongs on a route, keyed on the account being acted on.
 *
 * ---------------------------------------------------------------------------
 * THIS OVERLAPS WITH NGINX, ON PURPOSE
 * ---------------------------------------------------------------------------
 * A reverse proxy does the address dimension better and cheaper — it refuses
 * before Node is woken at all. Keep both: proxy configuration lives in a
 * different repository and drifts, and a request that arrives by any other path
 * still meets this.
 */
export const RATE_LIMIT_FLOOR = {
  NAME: 'floor-ip',

  LIMIT: 1_200,

  WINDOW_MS: 60 * RATE_LIMIT_MS_PER_SECOND,
} as const;

export const RATE_LIMIT_ERROR_MESSAGE = {
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later.',
} as const;
