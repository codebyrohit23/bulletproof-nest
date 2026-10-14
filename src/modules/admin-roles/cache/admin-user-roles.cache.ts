import { Injectable } from '@nestjs/common';

import { CACHE_TTL, CacheService } from '#/core/cache/index.js';

/**
 * Which roles an admin holds — one key per admin. What those roles grant is a
 * separate key per role.
 *
 * One minute: losing a role must take effect quickly even if the delete that
 * should have done it was lost. Never null — an admin with no roles is `[]`.
 */
@Injectable()
export class AdminUserRolesCacheService {
  private static readonly VERSION = 1;

  constructor(private readonly cache: CacheService) {}

  private key(adminId: string): string {
    return this.cache.globalKey({
      resource: 'admin-user-roles',
      version: AdminUserRolesCacheService.VERSION,
      segments: [adminId],
    });
  }

  async remember(adminId: string, loader: () => Promise<string[]>): Promise<string[]> {
    return this.cache.remember(this.key(adminId), loader, { ttlSeconds: CACHE_TTL.ONE_MINUTE });
  }

  async invalidate(adminIds: readonly string[]): Promise<void> {
    if (adminIds.length === 0) {
      return;
    }

    await this.cache.delete(adminIds.map((id) => this.key(id)));
  }
}
