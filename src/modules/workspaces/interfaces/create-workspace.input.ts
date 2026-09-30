import type { Prisma } from '@prisma/client';

/**
 * What the repository writes for a new workspace. The service chooses `slug`
 * and `status`; the rest comes from the request.
 */
export type CreateWorkspaceRow = Pick<
  Prisma.WorkspaceUncheckedCreateInput,
  | 'name'
  | 'slug'
  | 'businessType'
  | 'status'
  | 'ownerUserId'
  | 'countryCode'
  | 'timezone'
  | 'currency'
  | 'reraNumber'
>;
