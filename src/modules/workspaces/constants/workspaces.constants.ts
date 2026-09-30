import { type Prisma, WorkspaceStatus } from '@prisma/client';

export const WORKSPACES_LOG_CONTEXT = 'Workspaces';

export const WORKSPACE_REQUIRES_APPROVAL = true;

export const MAX_OWNED_WORKSPACES = 5;

export const OWNED_WORKSPACE_CAP_STATUSES = [
  WorkspaceStatus.PENDING_APPROVAL,
  WorkspaceStatus.ACTIVE,
  WorkspaceStatus.SUSPENDED,
] as const satisfies readonly WorkspaceStatus[];

export const SWITCHER_WORKSPACE_STATUSES = [
  WorkspaceStatus.PENDING_APPROVAL,
  WorkspaceStatus.ACTIVE,
  WorkspaceStatus.SUSPENDED,
  WorkspaceStatus.REJECTED,
] as const satisfies readonly WorkspaceStatus[];

export const WORKSPACE_CREATE_ATTEMPTS = 2;

export const WORKSPACE_NAME = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 150,
} as const;

export const WORKSPACE_SLUG = {
  MIN_LENGTH: 3,

  MAX_LENGTH: 60,

  PATTERN: /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,

  SUFFIX_LENGTH: 4,

  SUFFIXED_CANDIDATES: 5,

  FALLBACK: 'workspace',
} as const;

export const RESERVED_WORKSPACE_SLUGS: ReadonlySet<string> = new Set([
  'admin',
  'api',
  'app',
  'auth',
  'billing',
  'dashboard',
  'docs',
  'help',
  'leadflow',
  'login',
  'settings',
  'signup',
  'status',
  'support',
  'www',
]);

export const RERA_NUMBER = {
  MIN_LENGTH: 3,

  MAX_LENGTH: 50,

  /** Registration numbers vary by state: `P51800012345`, `PRM/KA/RERA/1251/…`. */
  PATTERN: /^[A-Z0-9/-]+$/,
} as const;

export const WORKSPACE_SELECT = {
  id: true,
  name: true,
  slug: true,
  businessType: true,
  status: true,
  ownerUserId: true,
  countryCode: true,
  timezone: true,
  currency: true,
  reraNumber: true,
  reviewNote: true,
  onboardingCompletedAt: true,
  createdAt: true,
} as const satisfies Prisma.WorkspaceSelect;

export const MY_WORKSPACE_SELECT = {
  id: true,
  joinedAt: true,
  lastAccessedAt: true,
  workspace: {
    select: {
      id: true,
      name: true,
      slug: true,
      businessType: true,
      status: true,
      ownerUserId: true,
      reviewNote: true,
    },
  },
} as const satisfies Prisma.WorkspaceMemberSelect;
