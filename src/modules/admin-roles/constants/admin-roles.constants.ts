export const ADMIN_ROLES_LOG_CONTEXT = 'AdminRoles';

/** The platform team defines its own roles; past this many, it wants a different model. */
export const MAX_ADMIN_ROLES = 50;

export const ADMIN_ROLE_NAME = {
  MIN_LENGTH: 2,

  MAX_LENGTH: 100,
} as const;

export const ADMIN_ROLE_DESCRIPTION_MAX_LENGTH = 500;
