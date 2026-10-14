import { Injectable } from '@nestjs/common';

import { CACHE_NEGATIVE_TTL_SECONDS, CACHE_TTL, CacheService } from '#/core/cache/index.js';

import type { AdminGrantSubject } from '../interfaces/index.js';

/**
 * An admin's status and super-admin flag — one key per admin. Which roles the
 * admin holds, and what they grant, are cached in `modules/admin-roles`.
 *
 * One minute: suspending an admin or revoking super admin must take effect
 * quickly even if the delete that should have done it was lost.
 */
@Injectable()
export class AdminGrantSubjectCacheService {
  /** 2: role ids moved to `admin-user-roles` in `modules/admin-roles`. */
  private static readonly VERSION = 2;

  constructor(private readonly cache: CacheService) {}

  private key(adminId: string): string {
    return this.cache.globalKey({
      resource: 'admin-grant-subject',
      version: AdminGrantSubjectCacheService.VERSION,
      segments: [adminId],
    });
  }

  async remember(
    adminId: string,
    loader: () => Promise<AdminGrantSubject | null>,
  ): Promise<AdminGrantSubject | null> {
    return this.cache.remember(this.key(adminId), loader, {
      ttlSeconds: CACHE_TTL.ONE_MINUTE,
      negativeTtlSeconds: CACHE_NEGATIVE_TTL_SECONDS,
    });
  }

  async invalidate(adminId: string): Promise<void> {
    await this.cache.delete(this.key(adminId));
  }
}
