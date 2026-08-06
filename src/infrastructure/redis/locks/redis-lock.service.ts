import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { AppLoggerService } from '#/core/logger/index.js'; // value import — required for DI metadata

import { REDIS_LOCK_RELEASE_SCRIPT, REDIS_LOG_CONTEXT } from '../constants/redis.constants.js';
import type { RedisLockHandle } from '../interfaces/index.js';
import { RedisService } from '../redis.service.js'; // value import — required for DI metadata

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
 */
@Injectable()
export class RedisLockService {
  constructor(
    private readonly redis: RedisService,

    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Returns a handle on success, `null` when someone else holds the lock.
   *
   * The TTL is a deadlock guard: if the holder crashes mid-work the lock
   * expires rather than blocking every other process forever. Set it above the
   * expected work duration — a lock that expires while the holder is still
   * running defeats the purpose.
   */
  async acquire(key: string, ttlSeconds: number): Promise<RedisLockHandle | null> {
    const token = randomUUID();

    try {
      const result = await this.redis.client.set(key, token, 'EX', ttlSeconds, 'NX');

      return result === 'OK' ? { key, token } : null;
    } catch (error) {
      /*
       * A lock is an optimisation here, so an unreachable Redis must not fail
       * the caller — it degrades to "nobody holds a lock", and the work is
       * simply done unguarded.
       */
      this.logger.warn('Lock acquisition failed — proceeding without a lock', {
        context: REDIS_LOG_CONTEXT,
        operation: 'acquire',
        metadata: { key, reason: error instanceof Error ? error.message : 'unknown' },
      });

      return null;
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
      const released = await this.redis.client.eval(REDIS_LOCK_RELEASE_SCRIPT, 1, handle.key, handle.token);

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
   * Runs `operation` while holding the lock, or returns `null` if it is held
   * elsewhere. The caller decides what to do when it loses.
   */
  async withLock<T>(key: string, ttlSeconds: number, operation: () => Promise<T>): Promise<T | null> {
    const handle = await this.acquire(key, ttlSeconds);

    if (handle === null) {
      return null;
    }

    try {
      return await operation();
    } finally {
      await this.release(handle);
    }
  }
}
