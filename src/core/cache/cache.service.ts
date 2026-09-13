import { Injectable } from '@nestjs/common';

import { RequestContextService } from '#/core/context/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import { CacheStore } from '#/infrastructure/cache/index.js';
import { LOCK_OUTCOME, RedisLockService } from '#/infrastructure/redis/index.js';
import { delay } from '#/shared/utils/index.js';

import { CACHE_LOCK, CACHE_LOG_CONTEXT } from './constants/cache.constants.js';
import type {
  CacheKeyDescriptor,
  CacheRememberOptions,
  CacheSetOptions,
  CacheStats,
} from './interfaces/index.js';
import { CacheMetricsService } from './metrics/cache-metrics.service.js';
import { CircuitBreaker } from './resilience/circuit-breaker.js';
import { SingleFlight } from './resilience/single-flight.js';
import {
  buildGlobalCacheKey,
  buildGlobalResourcePrefix,
  buildTenantCacheKey,
  buildTenantCachePrefix,
  buildTenantResourcePrefix,
} from './utils/cache-key.util.js';
import {
  applyTtlJitter,
  deserialize,
  serialize,
  type CacheEnvelope,
} from './utils/serialization.util.js';

@Injectable()
export class CacheService {
  private readonly circuit = new CircuitBreaker();
  private readonly singleFlight = new SingleFlight();

  constructor(
    private readonly store: CacheStore,
    private readonly requestContext: RequestContextService,
    private readonly lock: RedisLockService,
    private readonly metrics: CacheMetricsService,
    private readonly logger: AppLoggerService,
  ) {}

  key(descriptor: CacheKeyDescriptor): string {
    return buildTenantCacheKey(this.requireWorkspaceId(), descriptor);
  }

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
    const entry = await this.read<T>(key);

    return entry === null ? null : entry.v;
  }

  private async read<T>(key: string): Promise<CacheEnvelope<T> | null> {
    if (!this.circuit.shouldAllow()) {
      this.metrics.recordSkip();

      return null;
    }

    try {
      const payload = await this.store.get(key);

      this.circuit.recordSuccess();

      const entry = payload === null ? null : deserialize<T>(payload);

      if (entry === null) {
        this.metrics.recordMiss();

        return null;
      }

      this.metrics.recordHit();

      return entry;
    } catch (error) {
      this.handleFailure(error, 'get', key);

      return null;
    }
  }

  async getMany<T>(keys: readonly string[]): Promise<(T | null)[]> {
    if (keys.length === 0) {
      return [];
    }

    if (!this.circuit.shouldAllow()) {
      this.metrics.recordSkip();

      return keys.map(() => null);
    }

    try {
      const payloads = await this.store.getMany(keys);

      this.circuit.recordSuccess();

      return payloads.map((payload) => {
        const entry = payload === null ? null : deserialize<T>(payload);

        if (entry === null) {
          this.metrics.recordMiss();

          return null;
        }

        this.metrics.recordHit();

        return entry.v;
      });
    } catch (error) {
      this.handleFailure(error, 'getMany', `${keys.length} keys`);

      return keys.map(() => null);
    }
  }

  async setMany<T>(
    entries: readonly { key: string; value: T; ttlSeconds: number }[],
  ): Promise<void> {
    if (entries.length === 0 || !this.circuit.shouldAllow()) {
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
    if (!this.circuit.shouldAllow()) {
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

    if (keys.length === 0 || !this.circuit.shouldAllow()) {
      return;
    }

    try {
      await this.store.delete(keys);

      this.circuit.recordSuccess();
    } catch (error) {
      this.handleFailure(error, 'delete', keys.join(','));
    }
  }

  async deleteByPrefix(prefix: string): Promise<number> {
    if (!this.circuit.shouldAllow()) {
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

  async remember<T>(
    key: string,
    loader: () => Promise<T>,
    options: CacheRememberOptions,
  ): Promise<T> {
    const cached = await this.read<T>(key);

    if (cached !== null) {
      return cached.v;
    }

    return this.singleFlight.run(key, async () =>
      options.lock === true
        ? this.loadWithLock(key, loader, options)
        : this.loadAndStore(key, loader, options),
    );
  }

  private async loadWithLock<T>(
    key: string,
    loader: () => Promise<T>,
    options: CacheRememberOptions,
  ): Promise<T> {
    const acquisition = await this.lock.acquire(key, CACHE_LOCK.TTL_SECONDS);

    if (acquisition.outcome === LOCK_OUTCOME.ACQUIRED) {
      try {
        return await this.loadAndStore(key, loader, options);
      } finally {
        await this.lock.release(acquisition.handle);
      }
    }

    if (acquisition.outcome === LOCK_OUTCOME.UNAVAILABLE) {
      return this.loadAndStore(key, loader, options);
    }

    for (let attempt = 0; attempt < CACHE_LOCK.MAX_WAITS; attempt += 1) {
      await delay(CACHE_LOCK.WAIT_MS);

      const cached = await this.read<T>(key);

      if (cached !== null) {
        return cached.v;
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
        circuit: this.circuit.state,
      },
    });
  }
}
