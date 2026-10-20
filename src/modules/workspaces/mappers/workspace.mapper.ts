import type { WorkspaceStatus } from '@prisma/client';

import type { AttachedImage } from '#/modules/files/index.js';

import type {
  CreateWorkspaceInput,
  CurrentWorkspace,
  MyWorkspace,
  Workspace,
} from '../dto/index.js';
import type {
  CreateWorkspaceRow,
  CurrentMembershipRow,
  MyWorkspaceRow,
  WorkspaceSnapshot,
} from '../interfaces/index.js';

/** Drops an omitted RERA number — `exactOptionalPropertyTypes` rejects an explicit `undefined`. */
export function toCreateWorkspaceRow(
  input: CreateWorkspaceInput,
  ownerUserId: string,
  slug: string,
  status: WorkspaceStatus,
): CreateWorkspaceRow {
  return {
    name: input.name,
    slug,
    businessType: input.businessType,
    status,
    ownerUserId,
    countryCode: input.countryCode,
    timezone: input.timezone,
    currency: input.currency,
    ...(input.reraNumber !== undefined ? { reraNumber: input.reraNumber } : {}),
  };
}

export function toWorkspace(
  workspace: WorkspaceSnapshot,
  callerUserId: string,
  logo: AttachedImage | null,
): Workspace {
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    businessType: workspace.businessType,
    status: workspace.status,
    countryCode: workspace.countryCode,
    timezone: workspace.timezone,
    currency: workspace.currency,
    reraNumber: workspace.reraNumber,
    reviewNote: workspace.reviewNote,
    logo,
    isOwner: workspace.ownerUserId === callerUserId,
    onboardingCompletedAt: workspace.onboardingCompletedAt?.toISOString() ?? null,
    createdAt: workspace.createdAt.toISOString(),
  };
}

export function toCurrentWorkspace(
  row: CurrentMembershipRow,
  callerUserId: string,
  logo: AttachedImage | null,
): CurrentWorkspace {
  return {
    workspace: toWorkspace(row.workspace, callerUserId, logo),
    membership: {
      id: row.id,
      jobTitle: row.jobTitle,
      joinedAt: row.joinedAt.toISOString(),
    },
  };
}

export function toMyWorkspace(
  row: MyWorkspaceRow,
  callerUserId: string,
  logo: AttachedImage | null,
): MyWorkspace {
  return {
    id: row.workspace.id,
    name: row.workspace.name,
    slug: row.workspace.slug,
    businessType: row.workspace.businessType,
    status: row.workspace.status,
    reviewNote: row.workspace.reviewNote,
    logo,
    isOwner: row.workspace.ownerUserId === callerUserId,
    memberId: row.id,
    joinedAt: row.joinedAt.toISOString(),
    lastAccessedAt: row.lastAccessedAt?.toISOString() ?? null,
  };
}
