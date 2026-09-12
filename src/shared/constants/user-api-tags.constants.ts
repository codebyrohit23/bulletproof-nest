import type { ApiTag } from '../interfaces/index.js';

export const HEALTH_API_TAG: ApiTag = {
  name: 'Health',
  description: 'Liveness and readiness probes. Not part of the versioned API.',
};

export const USER_AUTH_API_TAG: ApiTag = {
  name: 'User Authentication',
  description: 'Endpoints for user authentication and management.',
};

export const USER_PROFILE_API_TAG: ApiTag = {
  name: 'User Profile',
  description: "Endpoints for the signed-in user's own profile.",
};

export const USER_API_TAGS: readonly ApiTag[] = [
  HEALTH_API_TAG,
  USER_AUTH_API_TAG,
  USER_PROFILE_API_TAG,
];
