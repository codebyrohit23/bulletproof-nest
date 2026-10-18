import type { Prisma } from '@prisma/client';

/**
 * No `avatarFileId`: a file is uploaded by an existing user and set as their
 * avatar by the files module's claim, so no user is created with one.
 */
export type CreateUserInput = Pick<
  Prisma.UserCreateInput,
  'firstName' | 'lastName' | 'displayName'
>;
