import type { MembershipStatus, WorkspaceStatus } from '@prisma/client';

import { WORKSPACE_ACCESS_DENIAL, type WorkspaceAccessDenial } from '#/core/tenancy/index.js';

/**
 * What each status means at the tenant guard; `null` lets the request
 * through. `satisfies Record<…>` makes a status added to the schema without a
 * decision here a build error, rather than a status that falls through.
 */

/** LEFT and REMOVED read as never having joined — a former member learns nothing. */
export const MEMBERSHIP_STATUS_ACCESS = {
  ACTIVE: null,
  SUSPENDED: WORKSPACE_ACCESS_DENIAL.MEMBERSHIP_SUSPENDED,
  LEFT: WORKSPACE_ACCESS_DENIAL.NOT_A_MEMBER,
  REMOVED: WORKSPACE_ACCESS_DENIAL.NOT_A_MEMBER,
} as const satisfies Record<MembershipStatus, WorkspaceAccessDenial | null>;

export const WORKSPACE_STATUS_ACCESS = {
  ACTIVE: null,
  PENDING_APPROVAL: WORKSPACE_ACCESS_DENIAL.WORKSPACE_PENDING_APPROVAL,
  REJECTED: WORKSPACE_ACCESS_DENIAL.WORKSPACE_REJECTED,
  SUSPENDED: WORKSPACE_ACCESS_DENIAL.WORKSPACE_SUSPENDED,
  ARCHIVED: WORKSPACE_ACCESS_DENIAL.WORKSPACE_ARCHIVED,
} as const satisfies Record<WorkspaceStatus, WorkspaceAccessDenial | null>;
