import { Injectable } from '@nestjs/common';

import type { RateLimitStats } from '../interfaces/index.js';

/**
 * Counts what the limiter actually does.
 *
 * A rate limiter is the one component whose *correct-looking* behaviour and its
 * worst failure are the same event: a refusal. A rule configured an order of
 * magnitude too tight blocks real customers, returns a valid 429 while doing
 * it, and is discovered through a support ticket days later. These counters are
 * what turn that into a graph.
 *
 * `storeErrors` matters as much as the other two. Every one of those is a
 * request where the limit was not actually applied — the rule's failure policy
 * decided instead — so a rising count means the limits are quietly not being
 * enforced, whatever `denied` says.
 *
 * In-process and unlabelled, like `CacheMetricsService`, and for the same
 * reason: a label per key would be a label per user, which is how a metrics
 * backend gets taken down by the thing meant to observe it. Which *rule*
 * refused is recoverable from the warning log, which carries the key.
 */
@Injectable()
export class RateLimitMetricsService {
  private allowed = 0;

  private denied = 0;

  private storeErrors = 0;

  recordAllowed(): void {
    this.allowed += 1;
  }

  recordDenied(): void {
    this.denied += 1;
  }

  recordStoreError(): void {
    this.storeErrors += 1;
  }

  get stats(): RateLimitStats {
    const decided = this.allowed + this.denied;

    return {
      allowed: this.allowed,
      denied: this.denied,
      storeErrors: this.storeErrors,
      deniedRate: decided === 0 ? 0 : Number((this.denied / decided).toFixed(4)),
    };
  }

  reset(): void {
    this.allowed = 0;
    this.denied = 0;
    this.storeErrors = 0;
  }
}
