import { Injectable } from '@nestjs/common';

import { CACHE_NEGATIVE_TTL_SECONDS, CACHE_TTL, CacheService } from '#/core/cache/index.js';

import type { UserSnapshot } from '../interfaces/index.js';

@Injectable()
export class UserCacheService {
  private static readonly VERSION = 1;

  constructor(private readonly cache: CacheService) {}

  private readonly keys = {
    snapshot: (userId: string): string =>
      this.cache.globalKey({
        resource: 'user',
        version: UserCacheService.VERSION,
        segments: [userId],
      }),
  };

  async remember(
    userId: string,
    loader: () => Promise<UserSnapshot | null>,
  ): Promise<UserSnapshot | null> {
    return this.cache.remember(this.keys.snapshot(userId), loader, {
      ttlSeconds: CACHE_TTL.FIVE_MINUTES,
      negativeTtlSeconds: CACHE_NEGATIVE_TTL_SECONDS,
    });
  }

  async invalidate(userId: string | readonly string[]): Promise<void> {
    const ids = typeof userId === 'string' ? [userId] : userId;

    await this.cache.delete(ids.map((id) => this.keys.snapshot(id)));
  }
}
