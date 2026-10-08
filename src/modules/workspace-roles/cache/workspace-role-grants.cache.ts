import { Injectable } from '@nestjs/common';

import { CACHE_TTL, CacheService } from '#/core/cache/index.js';

/**
 * A custom role's permission keys — one key per role, shared by every member
 * who holds it, so an edit to a role deletes one key however many hold it.
 *
 * Global, not tenant-scoped: a role id is unique on its own.
 *
 * Read with `getMany`, which cannot tell a cached `null` from a miss. Safe
 * here because the value is never null: a role with no grants is `[]`.
 *
 * Default roles are never cached here — their permissions are the catalogue's.
 */
@Injectable()
export class WorkspaceRoleGrantsCacheService {
  private static readonly VERSION = 1;

  /** An edit deletes the key at once; the TTL only bounds a delete lost while Redis was down. */
  private static readonly TTL_SECONDS = CACHE_TTL.FIVE_MINUTES;

  constructor(private readonly cache: CacheService) {}

  private key(roleId: string): string {
    return this.cache.globalKey({
      resource: 'workspace-role-grants',
      version: WorkspaceRoleGrantsCacheService.VERSION,
      segments: [roleId],
    });
  }

  /** One round trip for every role. A role absent from the result was a miss. */
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
        ttlSeconds: WorkspaceRoleGrantsCacheService.TTL_SECONDS,
      })),
    );
  }

  async invalidate(roleIds: string | readonly string[]): Promise<void> {
    const ids = typeof roleIds === 'string' ? [roleIds] : roleIds;

    await this.cache.delete(ids.map((id) => this.key(id)));
  }
}
