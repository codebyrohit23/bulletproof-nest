import type { Prisma } from '@prisma/client';

/**
 * Narrowed for the same reason as `CreateUserInput`: `status` and `deletedAt`
 * are not the owner's to set.
 */
export type UpdateUserInput = Pick<
  Prisma.UserUpdateInput,
  'firstName' | 'lastName' | 'displayName'
>;
