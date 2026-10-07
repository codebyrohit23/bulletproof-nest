import type { Prisma } from '@prisma/client';

/**
 * Roles are assigned separately, through `admin_user_roles`. `isSuperAdmin` is
 * here for the bootstrap seeder, which creates the first admin as one; nothing
 * else sets it on creation.
 */
export type CreateAdminInput = Pick<
  Prisma.AdminCreateInput,
  'email' | 'firstName' | 'lastName' | 'displayName' | 'isSuperAdmin'
>;
