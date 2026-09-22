import { Injectable } from '@nestjs/common';

import { CACHE_NEGATIVE_TTL_SECONDS, CACHE_TTL, CacheService } from '#/core/cache/index.js';

import type { AdminSessionSnapshot } from '../interfaces/index.js';

@Injectable()
export class AdminSessionCacheService {
  private static readonly VERSION = 1;

  constructor(private readonly cache: CacheService) {}

  private readonly keys = {
    snapshot: (sessionId: string): string =>
      this.cache.globalKey({
        resource: 'admin-session',
        version: AdminSessionCacheService.VERSION,
        segments: [sessionId],
      }),
  };

  async remember(
    sessionId: string,
    loader: () => Promise<AdminSessionSnapshot | null>,
  ): Promise<AdminSessionSnapshot | null> {
    return this.cache.remember(this.keys.snapshot(sessionId), loader, {
      ttlSeconds: CACHE_TTL.FIVE_MINUTES,
      negativeTtlSeconds: CACHE_NEGATIVE_TTL_SECONDS,
    });
  }

  async invalidate(sessionId: string | readonly string[]): Promise<void> {
    const ids = typeof sessionId === 'string' ? [sessionId] : sessionId;

    await this.cache.delete(ids.map((id) => this.keys.snapshot(id)));
  }
}
