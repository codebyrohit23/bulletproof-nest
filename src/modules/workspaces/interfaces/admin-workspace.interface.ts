import type { Prisma, WorkspaceStatus } from '@prisma/client';

import type {
  ADMIN_WORKSPACE_DETAIL_SELECT,
  ADMIN_WORKSPACE_SUMMARY_SELECT,
} from '../constants/index.js';

export type AdminWorkspaceSummaryRow = Prisma.WorkspaceGetPayload<{
  select: typeof ADMIN_WORKSPACE_SUMMARY_SELECT;
}>;

export type AdminWorkspaceDetailRow = Prisma.WorkspaceGetPayload<{
  select: typeof ADMIN_WORKSPACE_DETAIL_SELECT;
}>;

/** The two ways a review ends. Approval opens the workspace; rejection closes it for good. */
export type ReviewOutcome = Extract<WorkspaceStatus, 'ACTIVE' | 'REJECTED'>;

export interface ReviewDecision {
  readonly outcome: ReviewOutcome;

  readonly adminId: string;

  readonly note: string | null;
}
