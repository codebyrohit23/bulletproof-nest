import { Injectable } from '@nestjs/common';

import { RedisService } from '#/infrastructure/redis/index.js';

import { CACHE_STORE_SCAN_COUNT } from '../constants/index.js';
import { CacheStore, type CacheStoreEntry } from '../interfaces/index.js';

/**
 * `extends`, not `implements`.
 *
 * Either would satisfy Nest, since the token comes from `provide: CacheStore`
 * rather than from the prototype chain. `extends` is preferred because it keeps
 * the door open for shared behaviour on the base class — an `implements` clause
 * would force every future store to reimplement it — and because `instanceof
 * CacheStore` then answers truthfully.
 */
@Injectable()
export class RedisCacheStore extends CacheStore {
  constructor(private readonly redis: RedisService) {
    super();
  }

  async get(key: string): Promise<string | null> {
    return this.redis.client.get(key);
  }

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

    return replies.map(([error, value]) =>
      error !== null || typeof value !== 'string' ? null : value,
    );
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

    await this.redis.client.unlink(...keys);
  }

  async deleteByPrefix(prefix: string): Promise<number> {
    const client = this.redis.client;
    const keyPrefix = client.options.keyPrefix ?? '';
    const match = `${keyPrefix}${prefix}*`;

    let cursor = '0';
    let removed = 0;

    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        'MATCH',
        match,
        'COUNT',
        CACHE_STORE_SCAN_COUNT,
      );

      cursor = nextCursor;

      if (keys.length > 0) {
        const unprefixed = keys.map((key) =>
          keyPrefix.length > 0 ? key.slice(keyPrefix.length) : key,
        );

        await client.unlink(...unprefixed);

        removed += unprefixed.length;
      }
    } while (cursor !== '0');

    return removed;
  }
}
