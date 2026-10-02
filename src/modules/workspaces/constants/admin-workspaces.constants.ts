import { IdentifierType, MembershipStatus, type Prisma } from '@prisma/client';

export const REVIEW_NOTE = {
  /** A rejection must say why; "no" is not a reason the owner can act on. */
  REJECT_MIN_LENGTH: 10,

  /** `workspaces.review_note` is VARCHAR(500). */
  MAX_LENGTH: 500,
} as const;

export const ADMIN_WORKSPACE_SEARCH_MAX_LENGTH = 100;

/**
 * The owner as an admin needs to see them. Read across into `users` and
 * `user_identities` for display only — this module never writes either.
 */
const ownerSelect = {
  select: {
    id: true,
    displayName: true,
    identities: {
      where: { identifierType: IdentifierType.EMAIL },
      select: { identifierValue: true, verifiedAt: true },
    },
  },
} as const satisfies Prisma.UserDefaultArgs;

export const ADMIN_WORKSPACE_SUMMARY_SELECT = {
  id: true,
  name: true,
  slug: true,
  businessType: true,
  status: true,
  countryCode: true,
  reraNumber: true,
  reviewedAt: true,
  createdAt: true,
  owner: ownerSelect,
} as const satisfies Prisma.WorkspaceSelect;

export const ADMIN_WORKSPACE_DETAIL_SELECT = {
  ...ADMIN_WORKSPACE_SUMMARY_SELECT,
  timezone: true,
  currency: true,
  reviewNote: true,
  onboardingCompletedAt: true,
  suspendedAt: true,
  archivedAt: true,
  updatedAt: true,
  reviewedByAdmin: { select: { id: true, displayName: true } },
  _count: { select: { members: { where: { status: MembershipStatus.ACTIVE } } } },
} as const satisfies Prisma.WorkspaceSelect;
