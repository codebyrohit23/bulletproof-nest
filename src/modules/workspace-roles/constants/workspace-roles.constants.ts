/**
 * Custom roles per workspace. Beyond this a workspace wants teams or scopes,
 * not more roles — and a role editor listing hundreds is not one anyone uses.
 */
export const MAX_CUSTOM_ROLES = 20;

export const WORKSPACE_ROLE_NAME = {
  MIN_LENGTH: 2,

  MAX_LENGTH: 100,
} as const;

export const WORKSPACE_ROLE_DESCRIPTION_MAX_LENGTH = 500;
