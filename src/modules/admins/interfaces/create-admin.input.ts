import type { Prisma } from '@prisma/client';

export type CreateAdminInput = Pick<
  Prisma.AdminCreateInput,
  'email' | 'firstName' | 'lastName' | 'displayName'
>;
