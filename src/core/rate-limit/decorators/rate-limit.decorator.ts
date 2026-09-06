import { SetMetadata, type CustomDecorator } from '@nestjs/common';

import {
  RATE_LIMIT_METADATA,
  RATE_LIMIT_SKIP_METADATA,
} from '../constants/rate-limit.constants.js';
import type { RateLimitDefinition } from '../interfaces/index.js';

/**
 * Declares the budgets a route carries, on top of the global floor.
 *
 *     @Post('login')
 *     @RateLimit(...AUTH_RATE_LIMIT.LOGIN)
 *
 * Several budgets are one decision: they are spent together, the first refusal
 * wins, and anything already spent on the way to that refusal is handed back.
 * Order is the order written, so put the budget whose refusal you most want to
 * see named first.
 *
 * A route almost always needs **two**: one keyed on the account being acted on,
 * and one keyed on `RATE_LIMIT_SUBJECT.IP` behind it. The first alone stops
 * someone attacking one account and does nothing about someone attacking a
 * different account each request.
 *
 * Applied to a class it covers every route in it. A method-level declaration
 * **replaces** the class-level one rather than adding to it — merging would
 * make the effective budget of a route something you have to assemble in your
 * head from two places.
 */
export const RateLimit = (...definitions: readonly RateLimitDefinition[]): CustomDecorator =>
  SetMetadata(RATE_LIMIT_METADATA, definitions);

/**
 * Opts a route out of rate limiting entirely, floor included.
 *
 * For endpoints that are polled by infrastructure rather than called by
 * clients — liveness and readiness probes, which a scheduler hits on a fixed
 * interval and which must never be refused.
 */
export const SkipRateLimit = (): CustomDecorator => SetMetadata(RATE_LIMIT_SKIP_METADATA, true);
