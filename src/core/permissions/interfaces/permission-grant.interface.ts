import type { AdminPermissionKey, WorkspacePermissionKey } from '../catalogue/index.js';

export interface WorkspaceGrantSubject {
  readonly workspaceId: string;

  readonly memberId: string;

  readonly userId: string;
}

export interface WorkspaceGrant {
  readonly isOwner: boolean;

  readonly roleIds: readonly string[];

  readonly permissions: ReadonlySet<WorkspacePermissionKey>;
}

export interface AdminGrant {
  readonly isSuperAdmin: boolean;

  readonly roleIds: readonly string[];

  readonly permissions: ReadonlySet<AdminPermissionKey>;
}
