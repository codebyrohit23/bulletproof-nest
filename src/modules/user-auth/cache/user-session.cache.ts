import { Injectable } from '@nestjs/common';

import { CACHE_NEGATIVE_TTL_SECONDS, CACHE_TTL, CacheService } from '#/core/cache/index.js';

import type { SessionSnapshot } from '../interfaces/index.js';

@Injectable()
export class UserSessionCacheService {
  private static readonly VERSION = 1;

  constructor(private readonly cache: CacheService) {}

  private readonly keys = {
    snapshot: (sessionId: string): string =>
      this.cache.globalKey({
        resource: 'user-session',
        version: UserSessionCacheService.VERSION,
        segments: [sessionId],
      }),
  };

  async remember(
    sessionId: string,
    loader: () => Promise<SessionSnapshot | null>,
  ): Promise<SessionSnapshot | null> {
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
