/**
 * Describes a limit's key without knowing how it is assembled.
 *
 * Modules supply this; `rate-limit-key.util.ts` turns it into a string, so the
 * layout can change in one place rather than across every call site.
 */
export interface RateLimitKeyDescriptor {
  /**
   * What is being limited: `otp-dispatch`, `login-attempt`, `api-quota`.
   *
   * Names the *rule*, not the subject. The subject goes in `segments`.
   */
  readonly resource: string;

  /**
   * Bumped when the rule's shape changes, and it exists for a different reason
   * than a cache version does.
   *
   * A counter is only an integer, so nothing can deserialize wrong. What goes
   * stale is the **window**: changing "3 per 5 minutes" to "3 per 1 minute"
   * leaves live keys still carrying a five-minute expiry, so for the next five
   * minutes some callers are held under a rule that no longer exists — and it
   * repairs itself before anyone can reproduce it. Bumping the version orphans
   * those keys and starts everyone on the new rule at once.
   */
  readonly version: number;

  /**
   * Who or what the limit applies to: `[identifierHash]`,
   * `[identifierHash, purpose]`, `[ipAddress]`.
   */
  readonly segments: readonly (string | number)[];
}
