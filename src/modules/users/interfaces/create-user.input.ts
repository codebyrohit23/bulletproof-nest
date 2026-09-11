import type { Prisma } from '@prisma/client';

export type CreateUserInput = Pick<
  Prisma.UserCreateInput,
  'firstName' | 'lastName' | 'displayName' | 'avatarFileId'
>;
