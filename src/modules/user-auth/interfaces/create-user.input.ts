import type { Prisma } from '@prisma/client';

/**
 * The fields a caller may supply when creating a user.
 *
 * Derived from Prisma's own create input rather than hand-written, so renaming
 * a column breaks compilation here instead of drifting silently.
 *
 * The narrowing is the point. `Prisma.UserCreateInput` also accepts `id`,
 * `state`, `createdAt`, `deletedAt` and nested writes for identities,
 * credentials and sessions — which would legalise
 * `create({ ..., state: 'ACTIVE' })` and hand out an account that skipped
 * verification entirely. Naming the four writable fields makes that
 * unrepresentable rather than merely discouraged.
 *
 * `state` is absent because a new account is always `PENDING` by schema
 * default; becoming `ACTIVE` is a separate, deliberate transition.
 */
export type CreateUserInput = Pick<Prisma.UserCreateInput, 'firstName' | 'lastName' | 'displayName' | 'avatarFileId'>;
