import type { Prisma } from '@prisma/client';

/**
 * The fields a caller may supply when adding an identity to a user.
 *
 * `userId` is the scalar rather than a nested `user: { connect: … }`, so the
 * repository is handed an id and not a relation-write instruction — which is
 * what keeps `Prisma.UserIdentityCreateInput`'s nested `user: { create: … }`
 * out of reach. Creating a user as a side effect of adding an email address is
 * not something this method should be able to express.
 *
 * `verifiedAt` is absent: an identity is always created unproven, and proving
 * it is a separate call with its own preconditions.
 */
export type CreateIdentityInput = Pick<
  Prisma.UserIdentityUncheckedCreateInput,
  'userId' | 'identifierType' | 'identifierValue'
>;
