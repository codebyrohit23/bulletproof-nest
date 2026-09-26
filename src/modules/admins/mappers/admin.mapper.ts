import type { AdminProfile, UpdateAdminProfileInput } from '../dto/index.js';
import type { AdminSnapshot, UpdateAdminInput } from '../interfaces/index.js';

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

export function toAdminProfile(admin: AdminSnapshot): AdminProfile {
  return {
    id: admin.id,
    email: admin.email,
    firstName: admin.firstName,
    lastName: admin.lastName,
    displayName: admin.displayName,
  };
}

/** Drops omitted fields — `exactOptionalPropertyTypes` rejects an explicit `undefined`. */
export function toUpdateAdminInput(input: UpdateAdminProfileInput): UpdateAdminInput {
  return {
    ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
    ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
    ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
  };
}
