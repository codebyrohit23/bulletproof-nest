import { Injectable } from '@nestjs/common';

import { RedisService } from '@/infrastructure/redis/index.js'; // value import — required for DI metadata

import { CACHE_SCAN_COUNT } from '../constants/cache.constants.js';
import type { CacheStore } from '../interfaces/index.js';

@Injectable()
export class RedisCacheStore implements CacheStore {
  constructor(private readonly redis: RedisService) {}

  async get(key: string): Promise<string | null> {
    return this.redis.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.client.set(key, value, 'EX', ttlSeconds);
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
