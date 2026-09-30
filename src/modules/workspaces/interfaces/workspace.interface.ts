import type { Prisma } from '@prisma/client';

import type { MY_WORKSPACE_SELECT, WORKSPACE_SELECT } from '../constants/index.js';

/**
 * Derived from the select rather than written out, so a column added to the
 * select reaches every mapper as a type error instead of silently not at all.
 */
export type WorkspaceSnapshot = Prisma.WorkspaceGetPayload<{ select: typeof WORKSPACE_SELECT }>;

/** One of the caller's memberships, with the workspace it opens. */
export type MyWorkspaceRow = Prisma.WorkspaceMemberGetPayload<{
  select: typeof MY_WORKSPACE_SELECT;
}>;
