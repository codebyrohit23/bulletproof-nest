import type { AttachedImage } from '#/modules/files/index.js';

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

export function toUserProfile(user: UserSnapshot, avatar: AttachedImage | null): UserProfile {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    avatar,
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
