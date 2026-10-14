import { Injectable } from '@nestjs/common';

import { CACHE_NEGATIVE_TTL_SECONDS, CACHE_TTL, CacheService } from '#/core/cache/index.js';
import { RequestContextService } from '#/core/context/index.js';

import type { MembershipAccessSnapshot, WorkspaceAccessSnapshot } from '../interfaces/index.js';

/**
 * The tenant guard's two facts about a request's place in a workspace, cached
 * apart because they change apart:
 *
 *   workspace     status and owner — one key shared by all members, so
 *                 suspending a workspace of five thousand deletes one key
 *   membership    the member and their status — one key per user, so
 *                 removing a member deletes theirs alone
 *
 * Which roles a member holds, and what those roles grant, are cached in
 * `modules/workspace-roles`, which owns the assignments.
 *
 * Global keys, not tenant keys: the guards read these before any workspace is
 * in context — setting it is what the tenant guard is for.
 *
 * Every read goes through the request memo: the tenant guard and the
 * permission guard both read the workspace and the membership, and the second
 * read in a request costs nothing. Every invalidation forgets the memo too.
 *
 * Read with parallel `remember`s rather than `getMany`: `getMany` returns a
 * cached `null` and a miss alike, so a negatively cached non-member would
 * reach the database on every request.
 */
@Injectable()
export class WorkspaceAccessCacheService {
  /** 2: the workspace snapshot gained `ownerUserId`. */
  private static readonly VERSION = 2;

  constructor(
    private readonly cache: CacheService,
    private readonly requestContext: RequestContextService,
  ) {}

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
   * Five minutes: status and owner change rarely, every member shares the key,
   * and each change deletes it at once — the TTL only bounds a missed delete.
   */
  async rememberWorkspace(
    workspaceId: string,
    loader: () => Promise<WorkspaceAccessSnapshot | null>,
  ): Promise<WorkspaceAccessSnapshot | null> {
    const key = this.keys.workspace(workspaceId);

    return this.requestContext.memo(key, () =>
      this.cache.remember(key, loader, {
        ttlSeconds: CACHE_TTL.FIVE_MINUTES,
        negativeTtlSeconds: CACHE_NEGATIVE_TTL_SECONDS,
      }),
    );
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
    const key = this.keys.membership(workspaceId, userId);

    return this.requestContext.memo(key, () =>
      this.cache.remember(key, loader, {
        ttlSeconds: CACHE_TTL.ONE_MINUTE,
        negativeTtlSeconds: CACHE_NEGATIVE_TTL_SECONDS,
      }),
    );
  }

  async invalidateWorkspace(workspaceId: string): Promise<void> {
    await this.drop([this.keys.workspace(workspaceId)]);
  }

  async invalidateMembership(workspaceId: string, userId: string): Promise<void> {
    await this.drop([this.keys.membership(workspaceId, userId)]);
  }

  private async drop(keys: readonly string[]): Promise<void> {
    for (const key of keys) {
      this.requestContext.forget(key);
    }

    await this.cache.delete(keys);
  }
}
