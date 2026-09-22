import type { AdminSnapshot } from '../interfaces/index.js';

export function toAdminSnapshot(admin: AdminSnapshot): AdminSnapshot {
  return {
    id: admin.id,
    email: admin.email,
    firstName: admin.firstName,
    lastName: admin.lastName,
    displayName: admin.displayName,
    status: admin.status,
    emailVerifiedAt: admin.emailVerifiedAt,
  };
}
