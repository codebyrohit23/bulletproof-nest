import type { AdminWorkspaceDetail, AdminWorkspaceSummary } from '../dto/index.js';
import type { AdminWorkspaceDetailRow, AdminWorkspaceSummaryRow } from '../interfaces/index.js';

export function toAdminWorkspaceSummary(row: AdminWorkspaceSummaryRow): AdminWorkspaceSummary {
  const email = row.owner.identities[0];

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    businessType: row.businessType,
    status: row.status,
    countryCode: row.countryCode,
    reraNumber: row.reraNumber,
    owner: {
      userId: row.owner.id,
      displayName: row.owner.displayName,
      email: email?.identifierValue ?? null,
      emailVerified: email?.verifiedAt != null,
    },
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toAdminWorkspaceDetail(row: AdminWorkspaceDetailRow): AdminWorkspaceDetail {
  return {
    ...toAdminWorkspaceSummary(row),
    timezone: row.timezone,
    currency: row.currency,
    reviewNote: row.reviewNote,
    reviewedBy:
      row.reviewedByAdmin === null
        ? null
        : { adminId: row.reviewedByAdmin.id, displayName: row.reviewedByAdmin.displayName },
    activeMembers: row._count.members,
    onboardingCompletedAt: row.onboardingCompletedAt?.toISOString() ?? null,
    suspendedAt: row.suspendedAt?.toISOString() ?? null,
    archivedAt: row.archivedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}
