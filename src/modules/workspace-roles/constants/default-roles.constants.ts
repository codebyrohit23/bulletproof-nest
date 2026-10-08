import type { WorkspaceDefaultRoleKey } from '#/core/permissions/index.js';

export const WORKSPACE_ROLES_LOG_CONTEXT = 'WorkspaceRoles';

export interface WorkspaceDefaultRoleDefinition {
  readonly name: string;

  readonly description: string;
}

/**
 * The default roles' rows, by `key`. The key is what identifies a default role
 * everywhere: the seeder upserts by it, and the resolver recognises a default
 * role by it and takes its permissions from the catalogue. Ids are generated
 * by the database and differ between environments; no code depends on them.
 *
 * Permissions are not here — a default role's set is the catalogue keys whose
 * `defaultFor` names it.
 */
export const WORKSPACE_DEFAULT_ROLES = {
  admin: {
    name: 'Admin',
    description: 'Runs the workspace: settings, members, invitations and roles.',
  },

  manager: {
    name: 'Manager',
    description: 'Runs the team day to day: invites people and sees the roles.',
  },

  agent: {
    name: 'Agent',
    description: 'Works inside the workspace and sees its members.',
  },
} as const satisfies Record<WorkspaceDefaultRoleKey, WorkspaceDefaultRoleDefinition>;
