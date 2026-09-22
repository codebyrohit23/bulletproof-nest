import type { ApiTag } from '../interfaces/index.js';

export const ADMIN_AUTH_API_TAG: ApiTag = {
  name: 'Admin Authentication',
  description: 'Sign-in and session management for the admin console.',
};

export const ADMIN_API_TAGS: readonly ApiTag[] = [ADMIN_AUTH_API_TAG];
