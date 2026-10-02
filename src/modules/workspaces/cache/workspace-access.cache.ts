import { Injectable } from '@nestjs/common';

import { CACHE_NEGATIVE_TTL_SECONDS, CACHE_TTL, CacheService } from '#/core/cache/index.js';

import type { MembershipAccessSnapshot, WorkspaceAccessSnapshot } from '../interfaces/index.js';

/**
 * The tenant guard's two facts, cached apart because they change apart.
 *
 * A workspace's status is one key shared by all its members, so suspending a
 * workspace of five thousand deletes one key. A membership is one key per
 * user, so removing a member deletes theirs alone. One combined key per member
 * would make every workspace change a prefix scan.
 *
 * Global keys, not tenant keys: the guard reads these before any workspace is
 * in context — setting it is what the guard is for.
 *
 * Read with two parallel `remember`s rather than one `getMany`: `getMany`
 * returns a cached `null` and a miss alike, so a negatively cached non-member
 * would reach the database on every request.
 */
@Injectable()
export class WorkspaceAccessCacheService {
  private static readonly VERSION = 1;

  constructor(private readonly cache: CacheService) {}

  private readonly keys = {
    workspace: (workspaceId: string): string =>
      this.cache.globalKey({
        resource: 'workspace-access',
        version: WorkspaceAccessCacheService.VERSION,
        segments: [workspaceId],
      }),

    membership: (workspaceId: string, userId: string): string =>
      this.cache.globalKey({
        resource: 'workspace-membership-access',
        version: WorkspaceAccessCacheService.VERSION,
        segments: [workspaceId, userId],
      }),
  };

  /**
   * Five minutes: status changes rarely, every member shares the key, and
   * each change deletes it at once — the TTL only bounds a missed delete.
   */
  async rememberWorkspace(
    workspaceId: string,
    loader: () => Promise<WorkspaceAccessSnapshot | null>,
  ): Promise<WorkspaceAccessSnapshot | null> {
    return this.cache.remember(this.keys.workspace(workspaceId), loader, {
      ttlSeconds: CACHE_TTL.FIVE_MINUTES,
      negativeTtlSeconds: CACHE_NEGATIVE_TTL_SECONDS,
    });
  }

  /**
   * One minute: this key is what keeps a removed member out, so a missed
   * delete must not leave them in for long. A non-member is cached briefly,
   * so probing ids costs Redis rather than Postgres.
   */
  async rememberMembership(
    workspaceId: string,
    userId: string,
    loader: () => Promise<MembershipAccessSnapshot | null>,
  ): Promise<MembershipAccessSnapshot | null> {
    return this.cache.remember(this.keys.membership(workspaceId, userId), loader, {
      ttlSeconds: CACHE_TTL.ONE_MINUTE,
      negativeTtlSeconds: CACHE_NEGATIVE_TTL_SECONDS,
    });
  }

  async invalidateWorkspace(workspaceId: string): Promise<void> {
    await this.cache.delete(this.keys.workspace(workspaceId));
  }

  async invalidateMembership(workspaceId: string, userId: string): Promise<void> {
    await this.cache.delete(this.keys.membership(workspaceId, userId));
  }
}
