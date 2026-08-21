import { Injectable } from '@nestjs/common';

import { REDIS_KEY_SEPARATOR } from '#/config/redis/index.js';
import { RequestContextService } from '#/core/context/index.js'; // value import — required for DI metadata
import { AppLoggerService } from '#/core/logger/index.js'; // value import — required for DI metadata
import { RedisLockService } from '#/infrastructure/redis/index.js'; // value import — required for DI metadata
import { delay } from '#/shared/utils/async.util.js';

import { CACHE_LOCK, CACHE_LOG_CONTEXT } from './constants/cache.constants.js';
import type {
  CacheKeyDescriptor,
  CacheRememberOptions,
  CacheSetOptions,
  CacheStats,
} from './interfaces/index.js';
import { CacheMetricsService } from './metrics/cache-metrics.service.js'; // value import — required for DI metadata
import { CircuitBreaker } from './resilience/circuit-breaker.js';
import { SingleFlight } from './resilience/single-flight.js';
import { RedisCacheStore } from './stores/redis-cache.store.js'; // value import — required for DI metadata
import {
  buildGlobalCacheKey,
  buildGlobalResourcePrefix,
  buildTenantCacheKey,
  buildTenantCachePrefix,
  buildTenantResourcePrefix,
} from './utils/cache-key.util.js';
import { applyTtlJitter, deserialize, serialize } from './utils/serialization.util.js';

/**
 * Cache-aside operations over a backing store.
 *
 * ---------------------------------------------------------------------------
 * THE CONTRACT: NOTHING HERE THROWS ON A STORE FAILURE
 * ---------------------------------------------------------------------------
 * A cache is an optimisation. If Redis is unreachable every request must still
 * succeed — slower, not broken. So store errors are logged, counted, and
 * treated as a miss, and writes never block the caller.
 *
 * The one exception is a *programming* error: asking for a tenant-scoped key
 * with no workspace in context. That is not a degraded cache, it is a
 * request about to read another tenant's data, and it fails loudly.
 *
 * Modules do not call this directly. Each owns a small cache service — see
 * `modules/<name>/cache/` — which holds its own key builders, TTLs and schema
 * version, and exposes typed methods rather than string keys.
 */
@Injectable()
export class CacheService {
  private readonly circuit = new CircuitBreaker();

  private readonly singleFlight = new SingleFlight();

  constructor(
    private readonly store: RedisCacheStore,

    private readonly requestContext: RequestContextService,

    private readonly lock: RedisLockService,

    private readonly metrics: CacheMetricsService,

    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Builds a key scoped to the active workspace.
   *
   * Throws when there is no workspace in context — see the class note.
   */
  key(descriptor: CacheKeyDescriptor): string {
    return buildTenantCacheKey(this.requireWorkspaceId(), descriptor);
  }

  /**
   * Builds a key for something that genuinely spans tenants — a user identity,
   * a verification code, an IP rate-limit counter.
   *
   * A separate method rather than an option so that opting out of tenant
   * isolation is visible at the call site during review.
   */
  globalKey(descriptor: CacheKeyDescriptor): string {
    return buildGlobalCacheKey(descriptor);
  }

  resourcePrefix(resource: string, version: number): string {
    return buildTenantResourcePrefix(this.requireWorkspaceId(), resource, version);
  }

  globalResourcePrefix(resource: string, version: number): string {
    return buildGlobalResourcePrefix(resource, version);
  }

  tenantPrefix(): string {
    return buildTenantCachePrefix(this.requireWorkspaceId());
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.circuit.isOpen) {
      this.metrics.recordSkip();

      return null;
    }

    try {
      const payload = await this.store.get(key);

      this.circuit.recordSuccess();

      if (payload === null) {
        this.metrics.recordMiss();

        return null;
      }

      this.metrics.recordHit();

      return deserialize<T>(payload);
    } catch (error) {
      this.handleFailure(error, 'get', key);

      return null;
    }
  }

  /**
   * Reads several keys in one round trip.
   *
   * Positional: index `i` is the value for `keys[i]`, `null` for a miss. Twenty
   * leads for a list view cost one round trip instead of twenty.
   */
  async getMany<T>(keys: readonly string[]): Promise<(T | null)[]> {
    if (keys.length === 0) {
      return [];
    }

    if (this.circuit.isOpen) {
      this.metrics.recordSkip();

      return keys.map(() => null);
    }

    try {
      const payloads = await this.store.getMany(keys);

      this.circuit.recordSuccess();

      return payloads.map((payload) => {
        if (payload === null) {
          this.metrics.recordMiss();

          return null;
        }

        this.metrics.recordHit();

        return deserialize<T>(payload);
      });
    } catch (error) {
      this.handleFailure(error, 'getMany', `${keys.length} keys`);

      return keys.map(() => null);
    }
  }

  async setMany<T>(
    entries: readonly { key: string; value: T; ttlSeconds: number }[],
  ): Promise<void> {
    if (entries.length === 0 || this.circuit.isOpen) {
      return;
    }

    try {
      await this.store.setMany(
        entries.map((entry) => ({
          key: entry.key,
          value: serialize(entry.value),
          ttlSeconds: applyTtlJitter(entry.ttlSeconds),
        })),
      );

      this.circuit.recordSuccess();
    } catch (error) {
      this.handleFailure(error, 'setMany', `${entries.length} keys`);
    }
  }

  async set<T>(key: string, value: T, options: CacheSetOptions): Promise<void> {
    if (this.circuit.isOpen) {
      this.metrics.recordSkip();

      return;
    }

    try {
      await this.store.set(key, serialize(value), applyTtlJitter(options.ttlSeconds));

      this.circuit.recordSuccess();
    } catch (error) {
      this.handleFailure(error, 'set', key);
    }
  }

  async delete(key: string | readonly string[]): Promise<void> {
    const keys = typeof key === 'string' ? [key] : key;

    if (keys.length === 0 || this.circuit.isOpen) {
      return;
    }

    try {
      await this.store.delete(keys);

      this.circuit.recordSuccess();
    } catch (error) {
      this.handleFailure(error, 'delete', keys.join(','));
    }
  }

  /**
   * Removes every key under a prefix.
   *
   * Scans, so it costs more than a version bump. Prefer bumping a resource's
   * schema version for wholesale invalidation; use this for the narrow case of
   * one entity's several cached views.
   */
  async deleteByPrefix(prefix: string): Promise<number> {
    if (this.circuit.isOpen) {
      return 0;
    }

    try {
      const removed = await this.store.deleteByPrefix(prefix);

      this.circuit.recordSuccess();

      return removed;
    } catch (error) {
      this.handleFailure(error, 'deleteByPrefix', prefix);

      return 0;
    }
  }

  /**
   * Cache-aside: return the cached value, otherwise load, store and return it.
   *
   * Concurrent callers for the same key share one loader invocation, so an
   * expiring hot key produces a single database query rather than one per
   * in-flight request.
   *
   * `null` from the loader is only cached when `negativeTtlSeconds` is given.
   * Without it, repeated lookups of a non-existent id reach the database every
   * time — trivially triggered when the id comes from a URL.
   */
  async remember<T>(
    key: string,
    loader: () => Promise<T>,
    options: CacheRememberOptions,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    return this.singleFlight.run(key, async () =>
      options.lock === true
        ? this.loadWithLock(key, loader, options)
        : this.loadAndStore(key, loader, options),
    );
  }

  /**
   * One replica loads, the rest wait for its result.
   *
   * The loser polls the cache rather than the lock: what it needs is the value,
   * and the winner writes it the moment it has it. Giving up after the wait
   * budget and loading unguarded is deliberate — a crashed or very slow winner
   * must not stall every other request until the lock's TTL expires.
   */
  private async loadWithLock<T>(
    key: string,
    loader: () => Promise<T>,
    options: CacheRememberOptions,
  ): Promise<T> {
    const lockKey = `${key}${REDIS_KEY_SEPARATOR}${CACHE_LOCK.KEY_SUFFIX}`;
    const handle = await this.lock.acquire(lockKey, CACHE_LOCK.TTL_SECONDS);

    if (handle !== null) {
      try {
        return await this.loadAndStore(key, loader, options);
      } finally {
        await this.lock.release(handle);
      }
    }

    for (let attempt = 0; attempt < CACHE_LOCK.MAX_WAITS; attempt += 1) {
      await delay(CACHE_LOCK.WAIT_MS);

      const cached = await this.get<T>(key);

      if (cached !== null) {
        return cached;
      }
    }

    this.logger.warn('Cache lock wait exhausted — loading without it', {
      context: CACHE_LOG_CONTEXT,
      operation: 'remember',
      metadata: { key, waitedMs: CACHE_LOCK.WAIT_MS * CACHE_LOCK.MAX_WAITS },
    });

    return this.loadAndStore(key, loader, options);
  }

  private async loadAndStore<T>(
    key: string,
    loader: () => Promise<T>,
    options: CacheRememberOptions,
  ): Promise<T> {
    const value = await loader();

    if (value === null || value === undefined) {
      if (options.negativeTtlSeconds !== undefined) {
        await this.set(key, value, { ttlSeconds: options.negativeTtlSeconds });
      }

      return value;
    }

    await this.set(key, value, { ttlSeconds: options.ttlSeconds });

    return value;
  }

  get stats(): CacheStats {
    return this.metrics.stats;
  }

  private requireWorkspaceId(): string {
    const workspaceId = this.requestContext.workspaceId;

    if (workspaceId === undefined) {
      throw new Error(
        'A tenant-scoped cache key was requested with no workspace in context. ' +
          'Use globalKey() for entities that genuinely span tenants.',
      );
    }

    return workspaceId;
  }

  private handleFailure(error: unknown, operation: string, key: string): void {
    this.circuit.recordFailure();
    this.metrics.recordError();

    this.logger.warn(`Cache ${operation} failed — treating as a miss`, {
      context: CACHE_LOG_CONTEXT,
      operation,
      metadata: {
        key,
        reason: error instanceof Error ? error.message : 'unknown',
        circuitOpen: this.circuit.isOpen,
      },
    });
  }
}
