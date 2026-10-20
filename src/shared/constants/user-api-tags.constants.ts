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

export const WORKSPACES_API_TAG: ApiTag = {
  name: 'Workspaces',
  description: 'Creating workspaces and listing the ones the signed-in user belongs to.',
};

export const WORKSPACE_ROLES_API_TAG: ApiTag = {
  name: 'Workspace Roles',
  description: 'The permission catalogue and the roles a workspace grants it through.',
};

export const FILES_API_TAG: ApiTag = {
  name: 'Files',
  description:
    'Uploading a file straight to storage and following it until it is ready. A file is used ' +
    'by sending its id to the route that owns it — a profile, a workspace.',
};

export const USER_API_TAGS: readonly ApiTag[] = [
  HEALTH_API_TAG,
  USER_AUTH_API_TAG,
  USER_PROFILE_API_TAG,
  WORKSPACES_API_TAG,
  WORKSPACE_ROLES_API_TAG,
  FILES_API_TAG,
];
