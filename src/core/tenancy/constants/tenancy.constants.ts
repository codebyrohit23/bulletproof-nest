import { HttpStatus } from '@nestjs/common';

export const TENANCY_LOG_CONTEXT = 'Tenancy';

export const TENANCY_NO_WORKSPACE_METADATA = 'tenancy:no-workspace';

export const TENANCY_ERROR_MESSAGE = {
  WORKSPACE_REQUIRED: 'Choose a workspace: send its id in the x-workspace-id header.',
} as const;

export const WORKSPACE_ACCESS_DENIAL = {
  NOT_A_MEMBER: 'NOT_A_MEMBER',

  MEMBERSHIP_SUSPENDED: 'MEMBERSHIP_SUSPENDED',

  WORKSPACE_PENDING_APPROVAL: 'WORKSPACE_PENDING_APPROVAL',

  WORKSPACE_REJECTED: 'WORKSPACE_REJECTED',

  WORKSPACE_SUSPENDED: 'WORKSPACE_SUSPENDED',

  WORKSPACE_ARCHIVED: 'WORKSPACE_ARCHIVED',
} as const;

export type WorkspaceAccessDenial =
  (typeof WORKSPACE_ACCESS_DENIAL)[keyof typeof WORKSPACE_ACCESS_DENIAL];

/**
 * What each denial answers. A non-member gets 404 — the workspace is "not
 * visible", as for any other resource outside the caller's reach. A member
 * gets 403 and the reason, because they know the workspace exists and need to
 * know why it stopped working.
 */
export const WORKSPACE_ACCESS_REFUSAL = {
  NOT_A_MEMBER: {
    status: HttpStatus.NOT_FOUND,
    message: 'Workspace not found.',
  },

  MEMBERSHIP_SUSPENDED: {
    status: HttpStatus.FORBIDDEN,
    message: 'Your access to this workspace has been suspended.',
  },

  WORKSPACE_PENDING_APPROVAL: {
    status: HttpStatus.FORBIDDEN,
    message: 'This workspace is awaiting review and cannot be used yet.',
  },

  WORKSPACE_REJECTED: {
    status: HttpStatus.FORBIDDEN,
    message: 'This workspace was not approved.',
  },

  WORKSPACE_SUSPENDED: {
    status: HttpStatus.FORBIDDEN,
    message: 'This workspace has been suspended. Please contact support.',
  },

  WORKSPACE_ARCHIVED: {
    status: HttpStatus.FORBIDDEN,
    message: 'This workspace has been archived.',
  },
} as const satisfies Record<
  WorkspaceAccessDenial,
  { readonly status: HttpStatus; readonly message: string }
>;
