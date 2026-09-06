import type { RateLimitStoreFailurePolicy } from '../constants/rate-limit.constants.js';

/**
 * One budget: how many, over how long.
 *
 * Rules are owned by the module that needs them and should be **named
 * constants**, never inline literals. `{ limit: 3, windowMs: 300_000 }`
 * scattered across a controller is a set of limits nobody can audit;
 * `AUTH_RATE_LIMIT.REGISTER` puts every number for a feature in one reviewable
 * file.
 *
 * A rule counts requests. It is not the tool for "leave the thing you just
 * created alone for a moment" — that is a question about the state of that
 * thing, answered from the thing itself. Expressing it as `{ limit: 1 }` here
 * makes it look like a quota, which means it gets a `429` when what actually
 * happened is that nothing was wrong.
 */
export interface RateLimitRule {
  readonly limit: number;

  readonly windowMs: number;

  /**
   * What to do when the counter cannot be reached. Defaults to `ALLOW`.
   *
   * The default is deliberate: a limiter is protection, and protection that
   * takes the application down with it when its own store blinks has made
   * things worse. Rules where the limit is part of the safety rather than an
   * optimisation should say `DENY` explicitly, at the rule, where a reviewer
   * can see it.
   */
  readonly onStoreFailure?: RateLimitStoreFailurePolicy;
}

/**
 * One named rule applied to one key, for `consumeAll`.
 *
 * `name` is also the resource half of the key, so two checks sharing a name
 * share a counter — which is how one budget spans several routes, and how two
 * unrelated ones collide if a name is reused carelessly.
 *
 * It is what comes back as `deniedBy`, and the only way a caller can tell
 * *which* budget refused. That matters wherever the answers differ: a request
 * over the global floor and one over a per-address quota are both refusals, but
 * only one of them says anything about the address.
 */
export interface RateLimitCheck {
  readonly name: string;

  readonly key: string;

  readonly rule: RateLimitRule;
}
