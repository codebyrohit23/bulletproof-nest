import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyReply, FastifyRequest } from 'fastify';

import { SecurityConfigService } from '#/config/security/index.js';
import { TooManyRequestsException } from '#/core/exceptions/index.js';
import { RATE_LIMIT_HEADER } from '#/shared/constants/index.js';

import {
  RATE_LIMIT_DEFAULT_VERSION,
  RATE_LIMIT_ERROR_MESSAGE,
  RATE_LIMIT_FLOOR,
  RATE_LIMIT_METADATA,
  RATE_LIMIT_MS_PER_SECOND,
  RATE_LIMIT_SKIP_METADATA,
  RATE_LIMIT_SUBJECT,
} from '../constants/index.js';
import type { RateLimitCheck, RateLimitDefinition, RateLimitOutcome } from '../interfaces/index.js';
import { RateLimitSubjectResolver } from '../resolvers/rate-limit-subject.resolver.js';
import { RateLimitService } from '../services/rate-limit.service.js';

const HTTP_CONTEXT = 'http';
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
