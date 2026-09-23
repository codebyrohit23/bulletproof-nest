import { Injectable } from '@nestjs/common';

import { RequestContextService } from '#/core/context/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import { RateLimitStore, type RateLimitWindow } from '#/infrastructure/rate-limit/index.js';

import {
  RATE_LIMIT_LOG_CONTEXT,
  RATE_LIMIT_MS_PER_SECOND,
  RATE_LIMIT_STORE_FAILURE,
} from '../constants/index.js';
import type {
  RateLimitCheck,
  RateLimitKeyDescriptor,
  RateLimitOutcome,
  RateLimitRule,
  RateLimitStats,
  RateLimitVerdict,
} from '../interfaces/index.js';
import { buildGlobalRateLimitKey, buildTenantRateLimitKey } from '../utils/rate-limit-key.util.js';

import { RateLimitMetricsService } from './rate-limit-metrics.service.js';

/**
 * Rate-limit policy: which key, which budget, and what a refusal means.
 *
 * Everything about *counting* is behind `RateLimitStore` and stays in
 * `infrastructure`. Nothing here issues a Redis command, and the store makes no
 * decisions — the line between them is that clean, and worth keeping so.
 *
 * ---------------------------------------------------------------------------
 * THIS IS NOT INJECTED INTO FEATURE SERVICES DIRECTLY
 * ---------------------------------------------------------------------------
 * Each module declares its budgets in one file and binds them to routes with
 * `@RateLimit`:
 *
 *     modules/user-auth/rate-limit/user-auth-limits.constants.ts
 *
 * Why: the limits for a feature end up in one reviewable file instead of
 * scattered as literals, `core` never learns what an identifier or a purpose
 * is, and the key layout can change without a repo-wide grep.
 *
 * ---------------------------------------------------------------------------
 * FAILING OPEN IS A DECISION, NOT AN ACCIDENT
 * ---------------------------------------------------------------------------
 * A store that cannot be reached raises rather than returning a miss, and this
 * is where that is turned into an answer — per rule, because the right answer
 * differs. `ALLOW` is the default: a limiter is protection, and protection that
 * takes registration down with it when Redis blinks has made things worse than
 * the burst it was guarding against. Rules where the limit is part of the
 * safety say `DENY` at the rule, in the open.
 *
 * Either way the event is counted and logged. A rising `storeErrors` means the
 * limits are quietly not being enforced, whatever `denied` says.
 */
@Injectable()
export class RateLimitService {
  constructor(
    private readonly store: RateLimitStore,

    private readonly requestContext: RequestContextService,

    private readonly metrics: RateLimitMetricsService,

    private readonly logger: AppLoggerService,
  ) {}

  /**
   * A key scoped to the workspace in context.
   *
   * Throws when there is none, deliberately and loudly. Silently falling back
   * to a global key would merge every tenant's usage into one counter — one
   * busy customer would then rate-limit everybody else, and it would look like
   * the limit working correctly.
   */
  key(descriptor: RateLimitKeyDescriptor): string {
    return buildTenantRateLimitKey(this.requireWorkspaceId(), descriptor);
  }

  globalKey(descriptor: RateLimitKeyDescriptor): string {
    return buildGlobalRateLimitKey(descriptor);
  }

  /**
   * Spends one slot from `key`'s budget.
   */
  async consume(key: string, rule: RateLimitRule): Promise<RateLimitVerdict> {
    return (await this.consumeOne(key, rule)).verdict;
  }

  /**
   * Applies several budgets as one decision.
   *
   * ---------------------------------------------------------------------------
   * WHY THIS EXISTS RATHER THAN THREE CALLS
   * ---------------------------------------------------------------------------
   * Spending them one after another leaks budget on the way to a refusal:
   *
   *     floor            ✓ slot spent
   *     otp-register     ✓ slot spent      ← count 2 → 3
   *     otp-dispatch-all ✗ full            → refused
   *
   * Two slots have been spent and nothing was sent. Twice through that path and
   * a user's quota is gone with no mail to show for it. So the checks that
   * already succeeded are handed back before returning.
   *
   * Order matters and belongs to the caller: checks are evaluated in the order
   * given, the first refusal wins, and `deniedBy` names it — which is what lets
   * a caller tell a coarse refusal from a specific one.
   *
   * Each individual consume is atomic; the sequence is not. Two callers racing
   * can both pass a check the other was about to fail — bounded by one slot,
   * against budgets measured in threes and fifteens. Closing that would mean
   * one script over every key, which forces them all onto one cluster slot for
   * a case that costs at most one extra send.
   *
   * Only checks the store actually counted are handed back. A check that failed
   * open spent nothing, and refunding it would credit a counter that was never
   * charged — leaving the next window with more budget than the rule allows.
   */
  async consumeAll(checks: readonly RateLimitCheck[]): Promise<RateLimitOutcome> {
    const spent: RateLimitCheck[] = [];
    const passed: RateLimitVerdict[] = [];

    for (const check of checks) {
      const { verdict, counted } = await this.consumeOne(check.key, check.rule);

      if (!verdict.allowed) {
        await this.refundAll(spent);

        return { ...verdict, deniedBy: check.name };
      }

      passed.push(verdict);

      if (counted) {
        spent.push(check);
      }
    }

    return { ...this.tightest(passed), deniedBy: null };
  }

  /**
   * Reads a budget without spending it.
   *
   * For anything that wants to report a limit without applying it — a header on
   * a request another guard already refused, or an admin view.
   */
  async peek(key: string, rule: RateLimitRule): Promise<RateLimitVerdict> {
    try {
      return this.toVerdict(rule, await this.store.peek(key, rule.limit, rule.windowMs));
    } catch (error) {
      return this.onStoreFailure(error, 'peek', key, rule);
    }
  }

  /**
   * Returns one slot after the work it was claimed for failed.
   *
   * Never throws. The caller is already unwinding a real error, and a counter
   * that keeps one extra slot expires on its own.
   */
  async refund(key: string, rule: RateLimitRule): Promise<void> {
    try {
      await this.store.refund(key, rule.limit, rule.windowMs);
    } catch (error) {
      this.logger.warn('Could not return a rate-limit slot — it will expire', {
        context: RATE_LIMIT_LOG_CONTEXT,
        operation: 'refund',
        metadata: { key, reason: error instanceof Error ? error.message : 'unknown' },
      });
    }
  }

  get stats(): RateLimitStats {
    return this.metrics.stats;
  }

  /**
   * One consume, plus whether the store actually recorded it.
   *
   * `counted` is what separates a genuine allow from a fail-open one. Both look
   * identical in the verdict — that is the point of failing open — but only the
   * first spent a slot, and only the first can be given back.
   */
  private async consumeOne(
    key: string,
    rule: RateLimitRule,
  ): Promise<{ verdict: RateLimitVerdict; counted: boolean }> {
    try {
      const window = await this.store.consume(key, rule.limit, rule.windowMs);

      this.record(window.allowed);

      if (!window.allowed) {
        this.logRefusal(key, rule, window);
      }

      return { verdict: this.toVerdict(rule, window), counted: true };
    } catch (error) {
      return { verdict: this.onStoreFailure(error, 'consume', key, rule), counted: false };
    }
  }

  private async refundAll(checks: readonly RateLimitCheck[]): Promise<void> {
    for (const check of checks) {
      await this.refund(check.key, check.rule);
    }
  }

  private toVerdict(rule: RateLimitRule, window: RateLimitWindow): RateLimitVerdict {
    return {
      allowed: window.allowed,
      limit: rule.limit,
      remaining: window.remaining,
      resetInMs: window.resetInMs,
      retryAfterSeconds: window.allowed ? 0 : toRetryAfterSeconds(window.resetInMs),
    };
  }

  /**
   * The answer when the counter itself could not be reached.
   *
   * Reported as a full budget on `ALLOW` rather than as a spent one, because
   * nothing was counted — a caller reading `remaining: 0` would back off from a
   * limit that was never applied.
   */
  private onStoreFailure(
    error: unknown,
    operation: string,
    key: string,
    rule: RateLimitRule,
  ): RateLimitVerdict {
    const policy = rule.onStoreFailure ?? RATE_LIMIT_STORE_FAILURE.ALLOW;
    const allowed = policy === RATE_LIMIT_STORE_FAILURE.ALLOW;

    this.metrics.recordStoreError();

    this.logger.warn(`Rate-limit store unavailable — failing ${policy.toLowerCase()}`, {
      context: RATE_LIMIT_LOG_CONTEXT,
      operation,
      metadata: {
        key,
        policy,
        reason: error instanceof Error ? error.message : 'unknown',
      },
    });

    return {
      allowed,
      limit: rule.limit,
      remaining: allowed ? rule.limit : 0,
      resetInMs: allowed ? 0 : rule.windowMs,
      retryAfterSeconds: allowed ? 0 : toRetryAfterSeconds(rule.windowMs),
    };
  }

  private logRefusal(key: string, rule: RateLimitRule, window: RateLimitWindow): void {
    this.logger.warn('Rate limit reached', {
      context: RATE_LIMIT_LOG_CONTEXT,
      operation: 'consume',
      metadata: {
        key,
        limit: rule.limit,
        windowMs: rule.windowMs,
        resetInMs: window.resetInMs,
      },
    });
  }

  private record(allowed: boolean): void {
    if (allowed) {
      this.metrics.recordAllowed();

      return;
    }

    this.metrics.recordDenied();
  }

  /**
   * The verdict returned when every check in a composite passed: the budget
   * closest to running out.
   *
   * The verdicts are not merged — "remaining" across three different budgets is
   * not a number. One of them is reported instead, and which one is not
   * arbitrary: a caller told the *loosest* budget would be told it has fourteen
   * sends left while the budget that will actually stop it has one. Reporting
   * the tightest is what the `RateLimit-*` headers mean, and it is the only
   * choice that never overstates what is left.
   *
   * Ties on `remaining` go to the longer wait, for the same reason.
   */
  private tightest(verdicts: readonly RateLimitVerdict[]): RateLimitVerdict {
    const [first, ...rest] = verdicts;

    if (first === undefined) {
      return this.unlimited();
    }

    return rest.reduce((closest, verdict) => {
      if (verdict.remaining !== closest.remaining) {
        return verdict.remaining < closest.remaining ? verdict : closest;
      }

      return verdict.resetInMs > closest.resetInMs ? verdict : closest;
    }, first);
  }

  /**
   * The answer to an empty check list: nothing was limited, so there is no
   * budget to report. A guard reading this sets no headers.
   */
  private unlimited(): RateLimitVerdict {
    return {
      allowed: true,
      limit: 0,
      remaining: 0,
      resetInMs: 0,
      retryAfterSeconds: 0,
    };
  }

  private requireWorkspaceId(): string {
    const workspaceId = this.requestContext.workspaceId;

    if (workspaceId === undefined) {
      throw new Error(
        'A tenant-scoped rate limit was requested with no workspace in context. ' +
          'Use globalKey() for limits that apply before a workspace is chosen — ' +
          'registration, login and password reset all run before there is one.',
      );
    }

    return workspaceId;
  }
}

function toRetryAfterSeconds(remainingMs: number): number {
  return Math.max(1, Math.ceil(remainingMs / RATE_LIMIT_MS_PER_SECOND));
}
