/**
 * Every top-level namespace that exists in this Redis.
 *
 * ---------------------------------------------------------------------------
 * WHY A REGISTRY RATHER THAN A CONSTANT PER MODULE
 * ---------------------------------------------------------------------------
 * One Redis instance holds several unrelated kinds of data, and they have
 * nothing in common except the server. Caches may be dropped at will; a live
 * lock may not; flushing rate-limit counters quietly opens a spam window. An
 * operator staring at `SCAN` output has to be able to tell which is which:
 *
 *     cache:global:v2:user-session:01J8…    TTL'd, safe to drop
 *     lock:cache:global:v2:lead:42          live, do not touch
 *
 * The second reason is collisions. A prefix that lives inside the module that
 * uses it is invisible to whoever writes the next one, and two features
 * silently sharing `cache:` is the kind of bug that only shows up as data from
 * one feature appearing in another. Listed together, a duplicate is obvious at
 * review.
 *
 * This file holds **only the namespace**. Actual keys are built by the module
 * that owns the resource — `core/cache` for cached entities, and so on. Putting
 * real keys here would mean this layer knowing what a user or a lead is, which
 * is exactly the coupling the layering exists to prevent.
 *
 * ---------------------------------------------------------------------------
 * RESERVED, NOT YET DEFINED
 * ---------------------------------------------------------------------------
 * Added here when something actually uses them, not before — but named now so
 * nobody picks a colliding prefix in the meantime:
 *
 *     idem    idempotency keys for queue handlers and webhooks
 *     sess    server-side session state, if any is ever stored outside Postgres
 *
 * BullMQ is deliberately absent. It owns its own prefix through its `prefix`
 * option and builds keys inside Lua scripts that know nothing of this file.
 */
export const REDIS_DOMAIN = {
  CACHE: 'cache',

  LOCK: 'lock',

  /**
   * Request budgets.
   *
   * Short rather than spelled out because these are the highest-cardinality
   * keys in the store — one per subject per rule — and the prefix is repeated
   * on every one of them.
   *
   * Flushing this namespace is not free: every counter resets at once, which
   * hands every caller a full budget and opens exactly the burst the limits
   * exist to prevent.
   */
  RATE_LIMIT: 'rl',
} as const;

export type RedisDomain = (typeof REDIS_DOMAIN)[keyof typeof REDIS_DOMAIN];
