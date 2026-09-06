/**
 * What one window looks like after an operation.
 *
 * Deliberately mechanical. There is no `retryAfterSeconds` and no rule name
 * here: this describes the counter, not the decision taken because of it.
 * Turning this into something a caller can act on — and deciding what to do
 * when the store is unreachable — belongs to `core/rate-limit`.
 */
export interface RateLimitWindow {
  /**
   * For `consume`, whether the slot was taken. For `peek`, whether the next
   * `consume` would succeed.
   */
  readonly allowed: boolean;

  readonly remaining: number;

  /**
   * Milliseconds until this window resets and the budget is whole again.
   */
  readonly resetInMs: number;
}

/**
 * Counting, and nothing else.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS ABSTRACTION LIVES IN `infrastructure` AND NOT IN `core`
 * ---------------------------------------------------------------------------
 * The counting algorithm is not policy — it is storage mechanics. A fixed
 * window is `INCR`, an expiry on the first hit, and a TTL read back; a sliding
 * window is a sorted set of timestamps; a token bucket is arithmetic over a
 * stored refill time. None of that is a decision anybody in `core` should be
 * making or reading.
 *
 * That is also why there is no separate `strategies/` layer. **A strategy is a
 * store implementation.** Splitting them would force this interface to expose
 * the union of every algorithm's primitives — `increment`, plus sorted-set
 * operations for sliding windows, plus float arithmetic for buckets — and a
 * leaky interface that grows with each algorithm is worse than three small
 * classes behind a stable one.
 *
 * So the seam is here: a second algorithm is one new class in this folder and
 * zero lines changed in `core/rate-limit`.
 *
 * ---------------------------------------------------------------------------
 * WHY IT THROWS RATHER THAN DEGRADING
 * ---------------------------------------------------------------------------
 * A store that cannot reach Redis raises. It does **not** quietly allow the
 * call, and it does not fall back to an in-process counter.
 *
 * Whether an outage should let traffic through is a per-rule decision that only
 * the caller can make — an OTP send should still go out rather than break
 * registration, while a payment endpoint may prefer to refuse. Making that
 * choice here would apply one answer to every rule and hide it from review.
 * `core/rate-limit` catches and decides.
 *
 * ---------------------------------------------------------------------------
 * WHY AN ABSTRACT CLASS
 * ---------------------------------------------------------------------------
 * Same reason as `SessionValidator` in `core/auth`: an interface is erased at
 * compile time and cannot be an injection token, so it would need a `Symbol`
 * plus an `@Inject()` at every call site and no compiler check that the
 * provider matches. An abstract class is a type *and* a runtime token, and a
 * provider that drops a method fails the build.
 *
 * Callers receive **this**, never `RedisFixedWindowStore`. Keys, limits and
 * windows are supplied by whoever owns the rule; this decides nothing.
 */
export abstract class RateLimitStore {
  /**
   * Takes one slot from `key`'s window, creating the window if this is the
   * first hit in it.
   *
   * `windowMs` is fixed at creation: later hits inside a window must not push
   * its end further out, or a steady trickle keeps one window alive forever.
   */
  abstract consume(key: string, limit: number, windowMs: number): Promise<RateLimitWindow>;

  /**
   * Reads the window without spending anything.
   *
   * An untouched key reports a whole budget and `resetInMs: 0` — there is no
   * window yet, so nothing is waiting to reset.
   */
  abstract peek(key: string, limit: number, windowMs: number): Promise<RateLimitWindow>;

  /**
   * Gives one slot back.
   *
   * For work that claimed a slot and then failed. Without it a database error
   * still spends part of a budget, and the user is told to wait for something
   * that never happened.
   */
  abstract refund(key: string, limit: number, windowMs: number): Promise<void>;
}
