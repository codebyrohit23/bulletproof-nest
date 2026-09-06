/**
 * Rate-limit policy.
 *
 * Owns: key layout, tenant scoping, rule versioning, the composite decision,
 * what a refusal means, what happens when the counter is unreachable, the HTTP
 * guard that applies all of it, and the counters that make refusals visible.
 *
 * Does NOT own: counting. That is `infrastructure/rate-limit`, behind
 * `RateLimitStore`. Nothing here issues a Redis command or knows which
 * algorithm is running underneath.
 *
 * ---------------------------------------------------------------------------
 * HOW ROUTES USE THIS
 * ---------------------------------------------------------------------------
 * With the decorator. Every HTTP route already carries the floors; a route that
 * needs a real budget declares one:
 *
 *     @Post('login')
 *     @RateLimit(...AUTH_RATE_LIMIT.LOGIN)
 *
 * Rules belong to the module that needs them and should be **named constants**
 * in one file — `modules/user-auth/rate-limit/user-auth-limits.constants.ts` —
 * never inline literals. A set of limits spread across controllers is a set
 * nobody can audit.
 *
 * ---------------------------------------------------------------------------
 * PICKING A SUBJECT IS THE WHOLE DECISION
 * ---------------------------------------------------------------------------
 * `by: { bodyField }` counts against the account being acted on rather than the
 * caller, which is what makes three OTP requests for one address from three
 * devices a single budget.
 *
 * But an account-keyed budget only stops someone attacking *one* account. A
 * script that uses a new address each request never trips it. So **every route
 * needs `RATE_LIMIT_SUBJECT.IP` alongside**, as the ceiling that holds when the
 * account varies.
 *
 * Getting this wrong produces a limiter whose counters look healthy while it
 * stops nothing.
 *
 * ---------------------------------------------------------------------------
 * HOW NON-HTTP CALLERS USE THIS
 * ---------------------------------------------------------------------------
 * A queue producer or a scheduled task has no route to decorate, so it injects
 * `RateLimitService` and spends budgets itself, with its keys and rules in one
 * file next to it. `consumeAll` is the entry point when there is more than one
 * budget: it spends them as a single decision and hands back anything already
 * spent on the way to a refusal.
 *
 * Most auth limits want `globalKey`, not `key`. Registration, login and
 * password reset all run before a workspace has been chosen, so there is no
 * tenant to scope by — and `key()` throws rather than quietly merging every
 * tenant into one counter.
 *
 * ---------------------------------------------------------------------------
 * PLANNED — deliberately not built yet
 * ---------------------------------------------------------------------------
 *   RATE_LIMIT_SUBJECT.USER                WITH per-account request budgets
 *     "How many requests may one signed-in user make per minute" is a real
 *     question and this cannot answer it yet. Global guards run before
 *     route-level ones, so `UserAuthGuard` has not established an identity by
 *     the time this guard asks, and a user-keyed budget would silently fall
 *     back to an address — which on a shared office address is the wrong
 *     subject entirely.
 *
 *     The fix is a change to registration, not a new subject kind: make
 *     authentication global with a `@Public()` opt-out, then order the guards so
 *     this one runs after it. Do the two together.
 *
 *   RATE_LIMIT_SUBJECT.DEVICE              PROBABLY NEVER
 *     `x-device-id` is an unvalidated request header, so a script sends a fresh
 *     one per request and is never limited by it. It was removed rather than
 *     documented, because a subject that quietly stops nothing is worse than no
 *     subject at all. If a fair-use budget is ever wanted for honest clients
 *     stuck in a retry loop, it belongs next to a real one — never alone.
 *
 *   tenant-scoped route limits             WITH the first workspace-scoped API
 *     Every guard limit is global today, because every route that has one runs
 *     before a workspace exists. `key()` is already there for when that stops
 *     being true.
 */

export { RateLimitModule } from './rate-limit.module.js';

export { RateLimitService } from './services/rate-limit.service.js';

export { RateLimitMetricsService } from './services/rate-limit-metrics.service.js';

export { RateLimit, SkipRateLimit } from './decorators/rate-limit.decorator.js';

export {
  RATE_LIMIT_STORE_FAILURE,
  RATE_LIMIT_SUBJECT,
  type RateLimitStoreFailurePolicy,
  type RateLimitSubject,
} from './constants/rate-limit.constants.js';

export type {
  RateLimitBodyField,
  RateLimitBy,
  RateLimitCheck,
  RateLimitDefinition,
  RateLimitKeyDescriptor,
  RateLimitOutcome,
  RateLimitRule,
  RateLimitStats,
  RateLimitVerdict,
} from './interfaces/index.js';
