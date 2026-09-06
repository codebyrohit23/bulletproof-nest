import type { RateLimitSubject } from '../constants/rate-limit.constants.js';

import type { RateLimitRule } from './rate-limit-rule.interface.js';

/**
 * Counts against a value taken from the request body.
 *
 * For limits whose subject is not the caller but what the caller is *acting
 * on*: sends to one email address, resets for one account. Without this, three
 * OTP requests for the same address from three different devices are three
 * separate budgets, which is exactly the abuse the limit exists to stop.
 *
 * `bodyField` is a dot path — `identifier.value`, `email`. Guards run before
 * validation pipes, so the field may be missing or the wrong type on a request
 * that is about to be rejected anyway; the resolver falls back to the address
 * rather than letting a malformed body skip the limit.
 */
export interface RateLimitBodyField {
  readonly bodyField: string;
}

export type RateLimitBy = RateLimitSubject | RateLimitBodyField;

/**
 * One budget attached to a route by `@RateLimit`.
 *
 * `name` does three jobs: it is the resource half of the key, it is what comes
 * back as `deniedBy`, and it is what a reviewer reads to know what the budget
 * is for. It must be unique per rule — two routes sharing a name share a
 * counter.
 */
export interface RateLimitDefinition {
  readonly name: string;

  readonly rule: RateLimitRule;

  readonly by: RateLimitBy;

  /**
   * Bumped when the rule's shape changes, so live keys carrying the old
   * window are orphaned rather than holding callers under a rule that no
   * longer exists. Defaults to `1`.
   */
  readonly version?: number;
}
