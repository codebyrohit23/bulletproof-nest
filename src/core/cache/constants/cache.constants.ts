/**
 * Time-to-live presets, in seconds.
 *
 * Named rather than numeric at call sites so a review can see the intent —
 * `CACHE_TTL.FIVE_MINUTES` says something `300` does not.
 */
export const CACHE_TTL = {
  TEN_SECONDS: 10,
  THIRTY_SECONDS: 30,
  ONE_MINUTE: 60,
  FIVE_MINUTES: 300,
  FIFTEEN_MINUTES: 900,
  ONE_HOUR: 3_600,
  ONE_DAY: 86_400,
} as const;

/**
 * Short TTL for "this does not exist".
 *
 * Never caching a miss means a repeated lookup of an id that does not exist
 * hits the database every time — trivial to trigger when the id comes from a
 * URL. Caching it forever means a newly created record stays invisible. A few
 * seconds resolves both.
 */
export const CACHE_NEGATIVE_TTL_SECONDS = CACHE_TTL.TEN_SECONDS;

/**
 * Fraction of the TTL applied as random jitter, either side.
 *
 * Entries written during one request otherwise expire in the same millisecond
 * and stampede the database together.
 */
export const CACHE_TTL_JITTER_RATIO = 0.1;

/**
 * Distinguishes cache keys from locks, rate limits and sessions sharing the
 * same Redis, so an operator can inspect or drop one class without the others.
 */
export const CACHE_DOMAIN = 'cache';

export const CACHE_SCOPE = {
  TENANT: 'ws',
  GLOBAL: 'global',
} as const;

export const CACHE_VERSION_PREFIX = 'v';

/**
 * How many consecutive store failures open the circuit.
 *
 * Once open, calls return a miss immediately instead of each one waiting out
 * the command timeout and its retries. A cache is an optimisation, and a slow
 * cache is worse than no cache.
 */
export const CACHE_CIRCUIT = {
  FAILURE_THRESHOLD: 5,
  OPEN_DURATION_MS: 10_000,
} as const;

/**
 * `SCAN` batch size for prefix deletion. Large enough to keep round trips down,
 * small enough that a single call never blocks the server meaningfully.
 */
export const CACHE_SCAN_COUNT = 500;

export const CACHE_LOG_CONTEXT = 'CacheService';

/**
 * Cross-pod stampede lock, used only when a caller opts in.
 *
 * In-process single-flight already collapses concurrent callers within one
 * replica, so the lock buys the difference between one load per pod and one
 * load overall. That is worth two extra round trips for an aggregation or an
 * external API call, and not worth it for a single indexed lookup.
 *
 * `TTL_SECONDS` is a deadlock guard — it must exceed the slowest loader it
 * guards, or the lock expires while the holder is still working.
 *
 * A loser waits and re-checks the cache rather than queueing on the lock, and
 * gives up after `MAX_WAITS` to load unguarded. Waiting forever would turn one
 * slow loader into a stalled request for everyone.
 */
export const CACHE_LOCK = {
  TTL_SECONDS: 30,
  WAIT_MS: 50,
  MAX_WAITS: 20,
  KEY_SUFFIX: 'lock',
} as const;
