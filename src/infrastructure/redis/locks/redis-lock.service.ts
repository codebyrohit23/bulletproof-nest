import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { AppLoggerService } from '#/core/logger/index.js';

import { REDIS_DOMAIN } from '../constants/redis-key.constants.js';
import { REDIS_LOCK_RELEASE_SCRIPT, REDIS_LOG_CONTEXT } from '../constants/redis.constants.js';
import {
  LOCK_OUTCOME,
  type LockAcquisition,
  type LockedRun,
  type RedisLockHandle,
} from '../interfaces/index.js';
import { RedisService } from '../redis.service.js';
import { buildRedisKey } from '../utils/redis-key.util.js';

/**
 * Best-effort mutual exclusion across processes.
 *
 * Single-instance only: it holds while one Redis node holds. That is the right
 * trade for cache stampedes, cron de-duplication and import jobs, where the
 * cost of occasionally doing the work twice is a wasted query rather than
 * corruption. Anything where a double execution is genuinely unsafe — charging
 * a card, issuing an invoice number — needs a database constraint, not a lock.
 *
 * Not in `core/cache`: a lock is a Redis primitive with no knowledge of TTL
 * policy or tenants, and a cron job must be able to take one without importing
 * the cache module.
 *
 * ---------------------------------------------------------------------------
 * CALLERS NAME A SUBJECT, NOT A KEY
 * ---------------------------------------------------------------------------
 * The `lock:` namespace is applied here rather than by whoever is calling. A
 * caller that builds its own key can forget the prefix, and a lock filed under
 * `cache:` is one an operator clearing the cache will delete out from under the
 * process holding it. The subject is what is being locked — usually the key of
 * the thing being loaded — and this turns it into `lock:<subject>`.
 */
@Injectable()
export class RedisLockService {
  constructor(
    private readonly redis: RedisService,

    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Takes the lock, or says why it could not.
   *
   * The TTL is a deadlock guard: if the holder crashes mid-work the lock
   * expires rather than blocking every other process forever. Set it above the
   * expected work duration — a lock that expires while the holder is still
   * running defeats the purpose.
   *
   * ---------------------------------------------------------------------------
   * WHY THE REFUSALS ARE NAMED
   * ---------------------------------------------------------------------------
   * This used to answer `null` for both "somebody else holds it" and "Redis is
   * unreachable", and the two are opposites. Against a live holder, waiting
   * works — they will finish. Against an unreachable Redis, nobody holds
   * anything and waiting is time spent on a result that cannot arrive.
   *
   * Deciding between them is the caller's, not this service's: a cache is happy
   * to do the work unguarded, a cron job may prefer to skip the tick entirely.
   * So the reason is reported and no policy is applied here.
   */
  async acquire(subject: string, ttlSeconds: number): Promise<LockAcquisition> {
    const key = this.keyFor(subject);
    const token = randomUUID();

    try {
      const result = await this.redis.client.set(key, token, 'EX', ttlSeconds, 'NX');

      return result === 'OK'
        ? { outcome: LOCK_OUTCOME.ACQUIRED, handle: { key, token } }
        : { outcome: LOCK_OUTCOME.HELD };
    } catch (error) {
      this.logger.warn('Lock could not be reached — reporting it as unavailable', {
        context: REDIS_LOG_CONTEXT,
        operation: 'acquire',
        metadata: { key, reason: error instanceof Error ? error.message : 'unknown' },
      });

      return { outcome: LOCK_OUTCOME.UNAVAILABLE };
    }
  }

  /**
   * Releases only if this handle still owns the lock.
   *
   * A plain `DEL` is unsafe: if the holder overran its TTL the lock may already
   * have been re-acquired by another process, and deleting it would release
   * someone else's. The compare-and-delete runs as one Lua script so the check
   * and the delete cannot interleave.
   */
  async release(handle: RedisLockHandle): Promise<boolean> {
    try {
      const released = await this.redis.client.eval(
        REDIS_LOCK_RELEASE_SCRIPT,
        1,
        handle.key,
        handle.token,
      );

      return released === 1;
    } catch (error) {
      this.logger.warn('Lock release failed — it will expire on its own', {
        context: REDIS_LOG_CONTEXT,
        operation: 'release',
        metadata: { key: handle.key, reason: error instanceof Error ? error.message : 'unknown' },
      });

      return false;
    }
  }

  /**
   * Runs `operation` while holding the lock.
   *
   * `ran` distinguishes work that was skipped from work that ran and returned
   * nothing — the previous `T | null` could not, so a caller whose operation
   * legitimately returned `null` read it as a lost turn.
   */
  async withLock<T>(
    subject: string,
    ttlSeconds: number,
    operation: () => Promise<T>,
  ): Promise<LockedRun<T>> {
    const acquisition = await this.acquire(subject, ttlSeconds);

    if (acquisition.outcome !== LOCK_OUTCOME.ACQUIRED) {
      return { ran: false, reason: acquisition.outcome };
    }

    try {
      return { ran: true, value: await operation() };
    } finally {
      await this.release(acquisition.handle);
    }
  }

  private keyFor(subject: string): string {
    return buildRedisKey(REDIS_DOMAIN.LOCK, [subject]);
  }
}
