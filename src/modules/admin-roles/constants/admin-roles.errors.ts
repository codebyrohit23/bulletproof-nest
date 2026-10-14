import { MAX_ADMIN_ROLES } from './admin-roles.constants.js';

export const ADMIN_ROLE_ERROR_MESSAGE = {
  NOT_FOUND: 'Role not found.',

  RESTRICTED_PERMISSION: 'Super-admin-only permissions cannot be given to a role.',

  BEYOND_CALLER: 'You cannot give a role permissions you do not have yourself.',

  ROLE_BEYOND_CALLER: 'You cannot change a role that has permissions you do not have yourself.',

  NAME_TAKEN: 'An admin role with this name already exists.',

  LIMIT_REACHED: `There can be at most ${MAX_ADMIN_ROLES} admin roles.`,
} as const;
