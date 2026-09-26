import type { Prisma } from '@prisma/client';

/**
 * What an admin may change about themselves. `email` is absent: it is the
 * sign-in identity and the 2FA channel, so changing it needs its own proven
 * flow, not a profile edit. `status` and `deletedAt` are not the owner's to set.
 */
export type UpdateAdminInput = Pick<
  Prisma.AdminUpdateInput,
  'firstName' | 'lastName' | 'displayName'
>;
