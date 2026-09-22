import type { AdminSnapshot } from '#/modules/admins/index.js';

import type { AuthAdmin } from '../schemas/index.js';

export function toAuthAdmin(admin: AdminSnapshot): AuthAdmin {
  return {
    id: admin.id,
    email: admin.email,
    firstName: admin.firstName,
    ...(admin.lastName !== null ? { lastName: admin.lastName } : {}),
    displayName: admin.displayName,
  };
}
