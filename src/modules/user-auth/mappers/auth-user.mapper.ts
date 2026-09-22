import type { UserSnapshot } from '#/modules/users/index.js';

import type { AuthUser } from '../schemas/index.js';

/**
 * `lastName` is `null` in the database and absent in the response: a field the
 * client never sent is missing rather than empty.
 */
export function toAuthUser(user: UserSnapshot): AuthUser {
  return {
    id: user.id,
    firstName: user.firstName,
    ...(user.lastName !== null ? { lastName: user.lastName } : {}),
    displayName: user.displayName,
  };
}
