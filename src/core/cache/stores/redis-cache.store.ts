import { Injectable } from '@nestjs/common';

import { RedisService } from '@/infrastructure/redis/index.js'; // value import — required for DI metadata

import { CACHE_SCAN_COUNT } from '../constants/cache.constants.js';
import type { CacheStore, CacheStoreEntry } from '../interfaces/index.js';

@Injectable()
export class RedisCacheStore implements CacheStore {
  constructor(private readonly redis: RedisService) {}

  async get(key: string): Promise<string | null> {
    return this.redis.client.get(key);
  }

  /**
   * A pipeline of `GET`s rather than a single `MGET`.
   *
   * `MGET` is one command, so in Redis Cluster every key must hash to the same
   * slot — and cache keys deliberately carry no hash tag, so they will not. A
   * pipeline is still one round trip on a standalone server, and in a cluster
   * ioredis splits it per node automatically. Same cost today, works unchanged
   * later.
   */
  async getMany(keys: readonly string[]): Promise<(string | null)[]> {
    if (keys.length === 0) {
      return [];
    }

    const pipeline = this.redis.client.pipeline();

    for (const key of keys) {
      pipeline.get(key);
    }

    const replies = await pipeline.exec();

    if (replies === null) {
      return keys.map(() => null);
    }

    /*
     * Each reply is `[error, value]`. A per-key failure reads as a miss rather
     * than failing the whole batch — one bad key must not deny the caller the
     * other nineteen.
     */
    return replies.map(([error, value]) => (error !== null || typeof value !== 'string' ? null : value));
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.client.set(key, value, 'EX', ttlSeconds);
  }

  async setMany(entries: readonly CacheStoreEntry[]): Promise<void> {
    if (entries.length === 0) {
      return;
    }

    const pipeline = this.redis.client.pipeline();

    for (const entry of entries) {
      pipeline.set(entry.key, entry.value, 'EX', entry.ttlSeconds);
    }

    await pipeline.exec();
  }

  async delete(keys: readonly string[]): Promise<void> {
    if (keys.length === 0) {
      return;
    }

    /*
     * `UNLINK` reclaims memory on a background thread. `DEL` frees it inline,
     * which for a large batch blocks the server for the duration.
     */
    await this.redis.client.unlink(...keys);
  }

  /**
   * Removes every key under a prefix.
   *
   * Uses `SCAN`, never `KEYS`: `KEYS` walks the entire keyspace in one blocking
   * pass, which is fine on a laptop and an outage in production.
   *
   * The prefix handling is the subtle part. ioredis prepends `keyPrefix` to
   * every key you *send*, but `SCAN` returns keys exactly as stored — with the
   * prefix already on them. Passing those straight to `unlink` would prefix
   * them a second time and delete nothing, silently. So the match pattern is
   * built with the prefix and the results have it stripped before deletion.
   */
  async deleteByPrefix(prefix: string): Promise<number> {
    const client = this.redis.client;
    const keyPrefix = client.options.keyPrefix ?? '';
    const match = `${keyPrefix}${prefix}*`;

    let cursor = '0';
    let removed = 0;

    do {
      const [nextCursor, keys] = await client.scan(cursor, 'MATCH', match, 'COUNT', CACHE_SCAN_COUNT);

      cursor = nextCursor;

      if (keys.length > 0) {
        const unprefixed = keys.map((key) => (keyPrefix.length > 0 ? key.slice(keyPrefix.length) : key));

        await client.unlink(...unprefixed);

        removed += unprefixed.length;
      }
    } while (cursor !== '0');

    return removed;
  }
}
