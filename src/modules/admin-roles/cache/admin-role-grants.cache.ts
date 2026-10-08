import { Injectable } from '@nestjs/common';

import { CACHE_TTL, CacheService } from '#/core/cache/index.js';

/**
 * An admin role's permission keys, one key per role, shared by every admin who
 * holds it — the workspace role cache's shape on the admin plane. The value is
 * never null (a role with no grants is `[]`), so `getMany` is safe.
 */
@Injectable()
export class AdminRoleGrantsCacheService {
  private static readonly VERSION = 1;

  private static readonly TTL_SECONDS = CACHE_TTL.FIVE_MINUTES;

  constructor(private readonly cache: CacheService) {}

  private key(roleId: string): string {
    return this.cache.globalKey({
      resource: 'admin-role-grants',
      version: AdminRoleGrantsCacheService.VERSION,
      segments: [roleId],
    });
  }

  async getMany(roleIds: readonly string[]): Promise<Map<string, string[]>> {
    const values = await this.cache.getMany<string[]>(roleIds.map((id) => this.key(id)));

    const found = new Map<string, string[]>();

    roleIds.forEach((roleId, index) => {
      const value = values[index];

      if (Array.isArray(value)) {
        found.set(roleId, value);
      }
    });

    return found;
  }

  async setMany(grants: ReadonlyMap<string, readonly string[]>): Promise<void> {
    await this.cache.setMany(
      [...grants].map(([roleId, keys]) => ({
        key: this.key(roleId),
        value: [...keys],
        ttlSeconds: AdminRoleGrantsCacheService.TTL_SECONDS,
      })),
    );
  }

  async invalidate(roleIds: string | readonly string[]): Promise<void> {
    const ids = typeof roleIds === 'string' ? [roleIds] : roleIds;

    await this.cache.delete(ids.map((id) => this.key(id)));
  }
}
