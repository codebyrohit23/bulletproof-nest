import type { Prisma } from '@prisma/client';

/**
 * The fields a caller may supply when creating a user.
 *
 * Derived from Prisma's own create input rather than hand-written, so renaming
 * a column breaks compilation here instead of drifting silently.
 *
 * The narrowing is the point. `Prisma.UserCreateInput` also accepts `id`,
 * `status`, `createdAt`, `deletedAt` and nested writes for identities,
 * credentials and sessions — which would legalise
 * `create({ ..., status: 'SUSPENDED' })`, or an account arriving with its
 * identities already attached and unverified. Naming the four writable fields
 * makes that unrepresentable rather than merely discouraged.
 *
 * `status` is absent because every account is born `ACTIVE` by schema default.
 * Leaving it here would suggest sign-up gets a say in an account's lifecycle,
 * and the only two transitions that exist — deactivation and suspension — are
 * decisions made long after this call.
 */
export type CreateUserInput = Pick<
  Prisma.UserCreateInput,
  'firstName' | 'lastName' | 'displayName' | 'avatarFileId'
>;
