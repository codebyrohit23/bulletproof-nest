import type { MembershipStatus, WorkspaceStatus } from '@prisma/client';

/**
 * What the tenant guard needs to know about a workspace — and nothing else,
 * since it is cached once and read by every member's every request.
 */
export interface WorkspaceAccessSnapshot {
  readonly status: WorkspaceStatus;

  /** The owner holds every permission; the permission resolver reads it from here. */
  readonly ownerUserId: string;
}

/** What the tenant guard needs to know about one user's place in a workspace. */
export interface MembershipAccessSnapshot {
  readonly memberId: string;

  readonly status: MembershipStatus;
}
