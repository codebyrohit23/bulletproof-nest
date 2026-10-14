import { MAX_CUSTOM_ROLES } from './workspace-roles.constants.js';

export const WORKSPACE_ROLE_ERROR_MESSAGE = {
  NOT_FOUND: 'Role not found.',

  NOT_EDITABLE:
    'Default roles cannot be changed or deleted. Create a custom role with the permissions you need.',

  RESTRICTED_PERMISSION: 'Owner-only permissions cannot be given to a role.',

  BEYOND_CALLER: 'You cannot give a role permissions you do not have yourself.',

  ROLE_BEYOND_CALLER: 'You cannot change a role that has permissions you do not have yourself.',

  NAME_TAKEN: 'A role with this name already exists in this workspace.',

  LIMIT_REACHED: `A workspace can have at most ${MAX_CUSTOM_ROLES} custom roles.`,

  PENDING_INVITATIONS:
    'Pending invitations grant this role. Revoke them or change their role before deleting it.',
} as const;
