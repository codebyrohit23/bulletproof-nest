import type { UpdateProfileInput, UserProfile } from '../dto/index.js';
import type { UpdateUserInput, UserSnapshot } from '../interfaces/index.js';

export function toUserSnapshot(user: UserSnapshot): UserSnapshot {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    avatarFileId: user.avatarFileId,
    status: user.status,
  };
}

export function toUserProfile(user: UserSnapshot): UserProfile {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
  };
}

/** Drops omitted fields — `exactOptionalPropertyTypes` rejects an explicit `undefined`. */
export function toUpdateUserInput(input: UpdateProfileInput): UpdateUserInput {
  return {
    ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
    ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
    ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
  };
}
