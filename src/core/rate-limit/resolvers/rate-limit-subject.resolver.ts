import { Injectable } from '@nestjs/common';

import { RequestContextService } from '#/core/context/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import { TokenService } from '#/core/security/index.js';

import {
  RATE_LIMIT_LOG_CONTEXT,
  RATE_LIMIT_SUBJECT,
  RATE_LIMIT_SUBJECT_DIGEST_LENGTH,
  RATE_LIMIT_UNRESOLVED_SUBJECT,
} from '../constants/rate-limit.constants.js';
import type { RateLimitBy } from '../interfaces/index.js';

/**
 * Turns "who is this budget counted against" into two opaque key segments.
 *
 * ---------------------------------------------------------------------------
 * A MISSING BODY FIELD FALLS BACK TO THE ADDRESS RATHER THAN SKIPPING
 * ---------------------------------------------------------------------------
 * Guards run before validation pipes, so a request with a missing or malformed
 * body reaches here. Skipping the check would make every account-keyed limit
 * optional — omit the field, lose the budget — so it narrows to the address
 * instead. The request is about to be rejected anyway; it is counted in the
 * meantime.
 *
 * The kind that was actually used goes into the key, so a limit that fell back
 * to an address never shares a counter with one that resolved a body field.
 *
 * ---------------------------------------------------------------------------
 * WHY EVERY SUBJECT IS HASHED
 * ---------------------------------------------------------------------------
 * Keys surface in `SCAN`, `MONITOR` and the slowlog. An email address or a
 * client address read off an operator's terminal is a privacy incident nobody
 * chose, and there is nothing a plaintext subject buys — a counter is only ever
 * looked up by a key this same function builds.
 */
@Injectable()
export class RateLimitSubjectResolver {
  constructor(
    private readonly requestContext: RequestContextService,

    private readonly tokenService: TokenService,

    private readonly logger: AppLoggerService,
  ) {}

  resolve(by: RateLimitBy, body: unknown): readonly string[] {
    const subject = this.read(by, body);

    return [subject.kind, this.digest(subject.value)];
  }

  private read(by: RateLimitBy, body: unknown): Subject {
    if (typeof by === 'object') {
      return wrap('body', readBodyField(body, by.bodyField)) ?? this.byIp() ?? this.unresolved();
    }

    return this.byIp() ?? this.unresolved();
  }

  private byIp(): Subject | null {
    return wrap(RATE_LIMIT_SUBJECT.IP, this.requestContext.ip);
  }

  /**
   * Everything here shares one counter, which is tolerable only because it
   * should stay empty: an HTTP request with no remote address at all means a
   * proxy is not passing one on.
   */
  private unresolved(): Subject {
    this.logger.warn(
      'Rate-limit subject could not be resolved — counting against a shared bucket',
      {
        context: RATE_LIMIT_LOG_CONTEXT,
        operation: 'resolveSubject',
      },
    );

    return { kind: RATE_LIMIT_UNRESOLVED_SUBJECT, value: RATE_LIMIT_UNRESOLVED_SUBJECT };
  }

  private digest(value: string): string {
    return this.tokenService.hash(value).slice(0, RATE_LIMIT_SUBJECT_DIGEST_LENGTH);
  }
}

interface Subject {
  readonly kind: string;
  readonly value: string;
}

function wrap(kind: string, value: string | undefined | null): Subject | null {
  return value === undefined || value === null || value.length === 0 ? null : { kind, value };
}

/**
 * Walks a dot path into a parsed body.
 *
 * Lowercased, because the subject of a limit is the thing being acted on and
 * `A@example.com` is the same mailbox as `a@example.com`. Without it, varying
 * the case of an address is enough to open a fresh budget.
 */
function readBodyField(body: unknown, path: string): string | null {
  let current: unknown = body;

  for (const segment of path.split('.')) {
    if (typeof current !== 'object' || current === null) {
      return null;
    }

    current = (current as Record<string, unknown>)[segment];
  }

  return typeof current === 'string' && current.length > 0 ? current.toLowerCase() : null;
}
