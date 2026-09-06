import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { SecurityConfigService } from '#/config/security/index.js';
import { TooManyRequestsException } from '#/core/exceptions/index.js';

import {
  RATE_LIMIT_DEFAULT_VERSION,
  RATE_LIMIT_ERROR_MESSAGE,
  RATE_LIMIT_FLOOR,
  RATE_LIMIT_HEADER,
  RATE_LIMIT_METADATA,
  RATE_LIMIT_MS_PER_SECOND,
  RATE_LIMIT_SKIP_METADATA,
  RATE_LIMIT_SUBJECT,
} from '../constants/rate-limit.constants.js';
import type { RateLimitCheck, RateLimitDefinition, RateLimitOutcome } from '../interfaces/index.js';
import { RateLimitSubjectResolver } from '../resolvers/rate-limit-subject.resolver.js';
import { RateLimitService } from '../services/rate-limit.service.js';

const HTTP_CONTEXT = 'http';

/**
 * The HTTP half of rate limiting: which budgets a route carries, who they are
 * counted against, and what a caller is told when one is spent.
 *
 * ---------------------------------------------------------------------------
 * WHY EVERY ROUTE CARRIES A FLOOR
 * ---------------------------------------------------------------------------
 * A limiter that only guards the routes somebody remembered to decorate leaves
 * the newest endpoint — the one nobody has thought about yet — as the open one.
 * So the floor applies whether or not a route says anything, and `@RateLimit`
 * adds tighter budgets on top rather than replacing it.
 *
 * The floor is checked first. It is the coarsest gate, and a caller hammering
 * the API as a whole should be told that rather than told about whichever
 * endpoint they happened to land on.
 *
 * ---------------------------------------------------------------------------
 * WHY THE HEADERS ARE WRITTEN BEFORE THE REFUSAL IS THROWN
 * ---------------------------------------------------------------------------
 * A client told only "429" retries immediately and keeps hammering. `Retry-After`
 * comes from `TooManyRequestsException` via the exception filter; the
 * `RateLimit-*` fields are written here, onto the same reply, so they survive
 * onto the error response as well as onto a successful one.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS COSTS
 * ---------------------------------------------------------------------------
 * One Redis round trip per budget per request — two for a decorated route, one
 * for everything else. That is the price of a limit that holds across pods, and
 * it is why `RATE_LIMIT_ENABLED` exists: load tests and local development can
 * switch the whole layer off without any route changing shape.
 *
 * A store that cannot be reached does not take the API down with it. Each rule
 * decides that for itself, in `RateLimitService`, and the default is to allow.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,

    private readonly rateLimit: RateLimitService,

    private readonly subjects: RateLimitSubjectResolver,

    private readonly security: SecurityConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.security.rateLimit.enabled || context.getType() !== HTTP_CONTEXT) {
      return true;
    }

    if (this.isSkipped(context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const outcome = await this.rateLimit.consumeAll(
      this.checksFor(this.definitionsFor(context), request.body),
    );

    this.writeHeaders(context, outcome);

    if (outcome.deniedBy !== null) {
      throw new TooManyRequestsException(
        RATE_LIMIT_ERROR_MESSAGE.TOO_MANY_REQUESTS,
        outcome.retryAfterSeconds,
      );
    }

    return true;
  }

  private isSkipped(context: ExecutionContext): boolean {
    return (
      this.reflector.getAllAndOverride<boolean>(RATE_LIMIT_SKIP_METADATA, [
        context.getHandler(),
        context.getClass(),
      ]) === true
    );
  }

  /**
   * The floor, then whatever the route declared.
   *
   * A method-level declaration overrides a class-level one rather than adding
   * to it, so the budgets a route carries are readable in one place.
   */
  private definitionsFor(context: ExecutionContext): readonly RateLimitDefinition[] {
    const declared =
      this.reflector.getAllAndOverride<readonly RateLimitDefinition[]>(RATE_LIMIT_METADATA, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];

    return [FLOOR, ...declared];
  }

  private checksFor(definitions: readonly RateLimitDefinition[], body: unknown): RateLimitCheck[] {
    return definitions.map((definition) => ({
      name: definition.name,
      key: this.rateLimit.globalKey({
        resource: definition.name,
        version: definition.version ?? RATE_LIMIT_DEFAULT_VERSION,
        segments: this.subjects.resolve(definition.by, body),
      }),
      rule: definition.rule,
    }));
  }

  private writeHeaders(context: ExecutionContext, outcome: RateLimitOutcome): void {
    if (outcome.limit === 0) {
      return;
    }

    const reply = context.switchToHttp().getResponse<FastifyReply>();

    void reply.header(RATE_LIMIT_HEADER.LIMIT, outcome.limit);
    void reply.header(RATE_LIMIT_HEADER.REMAINING, outcome.remaining);
    void reply.header(
      RATE_LIMIT_HEADER.RESET,
      Math.ceil(outcome.resetInMs / RATE_LIMIT_MS_PER_SECOND),
    );
  }
}

const FLOOR: RateLimitDefinition = {
  name: RATE_LIMIT_FLOOR.NAME,
  rule: { limit: RATE_LIMIT_FLOOR.LIMIT, windowMs: RATE_LIMIT_FLOOR.WINDOW_MS },
  by: RATE_LIMIT_SUBJECT.IP,
};
