export interface RedisLockHandle {
  readonly key: string;

  readonly token: string;
}

/**
 * Why an attempt to take a lock ended the way it did.
 *
 * `HELD` and `UNAVAILABLE` are kept apart because they call for opposite
 * responses, and collapsing them into one `null` made both callers wrong:
 *
 * - `HELD` — somebody else is doing the work. Waiting is sensible; they will
 *   finish and the result will be there.
 * - `UNAVAILABLE` — Redis could not be reached, so *nobody* holds anything.
 *   Waiting is pure latency for a result that will never appear, and the caller
 *   should decide immediately whether to proceed unguarded.
 */
export const LOCK_OUTCOME = {
  ACQUIRED: 'ACQUIRED',

  HELD: 'HELD',

  UNAVAILABLE: 'UNAVAILABLE',
} as const;

export type LockOutcome = (typeof LOCK_OUTCOME)[keyof typeof LOCK_OUTCOME];

export type LockRefusal = Exclude<LockOutcome, typeof LOCK_OUTCOME.ACQUIRED>;

export type LockAcquisition =
  | { readonly outcome: typeof LOCK_OUTCOME.ACQUIRED; readonly handle: RedisLockHandle }
  | { readonly outcome: LockRefusal };

/**
 * The result of running work under a lock.
 *
 * `ran` is the discriminant, and it exists because the previous signature —
 * `Promise<T | null>` — could not say whether `null` meant "the work was
 * skipped" or "the work ran and returned null". A caller could not tell a
 * missing row from a missed turn.
 */
export type LockedRun<T> =
  { readonly ran: true; readonly value: T } | { readonly ran: false; readonly reason: LockRefusal };
