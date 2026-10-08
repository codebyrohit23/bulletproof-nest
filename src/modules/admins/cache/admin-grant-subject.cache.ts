import { Injectable } from '@nestjs/common';

import { CACHE_NEGATIVE_TTL_SECONDS, CACHE_TTL, CacheService } from '#/core/cache/index.js';

import type { AdminGrantSubject } from '../interfaces/index.js';

/**
 * An admin's status, super-admin flag and role ids — one key per admin. What
 * the roles grant is cached per role in `modules/admin-roles`.
 *
 * One minute: suspending an admin, revoking super admin or removing a role
 * must take effect quickly even if the delete that should have done it was lost.
 */
@Injectable()
export class AdminGrantSubjectCacheService {
  private static readonly VERSION = 1;

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
