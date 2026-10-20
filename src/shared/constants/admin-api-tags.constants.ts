import type { ApiTag } from '../interfaces/index.js';

export const ADMIN_AUTH_API_TAG: ApiTag = {
  name: 'Admin Authentication',
  description: 'Sign-in and session management for the admin console.',
};

export const ADMIN_PROFILE_API_TAG: ApiTag = {
  name: 'Admin Profile',
  description: "Endpoints for the signed-in admin's own profile.",
};

export const ADMIN_WORKSPACES_API_TAG: ApiTag = {
  name: 'Admin Workspaces',
  description: 'Every workspace on the platform, and the review that opens a new one.',
};

export const ADMIN_ROLES_API_TAG: ApiTag = {
  name: 'Admin Roles',
  description: 'The admin permission catalogue and the roles the platform team defines.',
};

export const ADMIN_FILES_API_TAG: ApiTag = {
  name: 'Admin Files',
  description: "Uploading the signed-in admin's own files, and following them until ready.",
};

export const ADMIN_API_TAGS: readonly ApiTag[] = [
  ADMIN_AUTH_API_TAG,
  ADMIN_PROFILE_API_TAG,
  ADMIN_WORKSPACES_API_TAG,
  ADMIN_ROLES_API_TAG,
  ADMIN_FILES_API_TAG,
];
