import { Injectable } from '@nestjs/common';

import { CACHE_TTL, CacheService } from '#/core/cache/index.js';
import { RequestContextService } from '#/core/context/index.js';

import type { WorkspaceRoleRef } from '../interfaces/index.js';

@Injectable()
export class WorkspaceMemberRolesCacheService {
  private static readonly VERSION = 1;

  constructor(
    private readonly cache: CacheService,
    private readonly requestContext: RequestContextService,
  ) {}

  private key(workspaceId: string, memberId: string): string {
    return this.cache.globalKey({
      resource: 'workspace-member-roles',
      version: WorkspaceMemberRolesCacheService.VERSION,
      segments: [workspaceId, memberId],
    });
  }

  async remember(
    workspaceId: string,
    memberId: string,
    loader: () => Promise<WorkspaceRoleRef[]>,
  ): Promise<WorkspaceRoleRef[]> {
    const key = this.key(workspaceId, memberId);

    return this.requestContext.memo(key, () =>
      this.cache.remember(key, loader, { ttlSeconds: CACHE_TTL.ONE_MINUTE }),
    );
  }

  async invalidate(workspaceId: string, memberIds: readonly string[]): Promise<void> {
    if (memberIds.length === 0) {
      return;
    }

    const keys = memberIds.map((memberId) => this.key(workspaceId, memberId));

    for (const key of keys) {
      this.requestContext.forget(key);
    }

    await this.cache.delete(keys);
  }
}
