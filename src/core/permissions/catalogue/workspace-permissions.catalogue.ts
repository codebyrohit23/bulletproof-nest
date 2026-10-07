import {
  definePermissionCatalogue,
  type PermissionCatalogueShape,
  type PermissionKeyOf,
} from './define-permission-catalogue.js';

export const WORKSPACE_DEFAULT_ROLE = {
  ADMIN: 'admin',

  MANAGER: 'manager',

  AGENT: 'agent',
} as const;

export type WorkspaceDefaultRoleKey =
  (typeof WORKSPACE_DEFAULT_ROLE)[keyof typeof WORKSPACE_DEFAULT_ROLE];

const { ADMIN, MANAGER, AGENT } = WORKSPACE_DEFAULT_ROLE;

const WORKSPACE_PERMISSION_SHAPE = {
  workspace: {
    update: {
      name: 'Update workspace settings',
      description:
        'Change the workspace’s name, URL, business type, country, timezone, currency and ' +
        'onboarding state.',
      defaultFor: [ADMIN],
    },

    archive: {
      name: 'Archive the workspace',
      description: 'Close the workspace for every member. Owner only.',
      restricted: true,
    },

    transferOwnership: {
      name: 'Transfer ownership',
      description: 'Make another active member the owner. Owner only.',
      restricted: true,
    },
  },

  member: {
    read: {
      name: 'View members',
      description: 'See who belongs to the workspace, with their roles and status.',
      defaultFor: [ADMIN, MANAGER, AGENT],
    },

    update: {
      name: 'Update members',
      description: 'Change a member’s job title; suspend or reactivate them.',
      defaultFor: [ADMIN],
    },

    changeRole: {
      name: 'Change a member’s roles',
      description: 'Assign and remove a member’s roles.',
      defaultFor: [ADMIN],
    },

    remove: {
      name: 'Remove members',
      description: 'Remove a member from the workspace.',
      defaultFor: [ADMIN],
    },
  },

  invitation: {
    read: {
      name: 'View invitations',
      description: 'See pending and past invitations.',
      defaultFor: [ADMIN, MANAGER],
    },

    create: {
      name: 'Invite people',
      description: 'Invite someone by email, or resend an invitation.',
      defaultFor: [ADMIN, MANAGER],
    },

    revoke: {
      name: 'Revoke invitations',
      description: 'Withdraw a pending invitation so its link stops working.',
      defaultFor: [ADMIN, MANAGER],
    },
  },

  role: {
    read: {
      name: 'View roles',
      description: 'See the workspace’s roles and what each one allows.',
      defaultFor: [ADMIN, MANAGER],
    },

    manage: {
      name: 'Manage custom roles',
      description: 'Create, edit, clone and delete custom roles.',
      defaultFor: [ADMIN],
    },
  },
} as const satisfies PermissionCatalogueShape<WorkspaceDefaultRoleKey>;

const WORKSPACE_PLANE = 'workspace';

const defined = definePermissionCatalogue(WORKSPACE_PLANE, WORKSPACE_PERMISSION_SHAPE, {
  defaultRoles: [ADMIN, MANAGER, AGENT],
});

/** `WORKSPACE_PERMISSION.member.read` — the key, typed to its plane. */
export const WORKSPACE_PERMISSION = defined.tree;

export const WORKSPACE_PERMISSION_CATALOGUE = defined.catalogue;

export type WorkspacePermissionKey = PermissionKeyOf<
  typeof WORKSPACE_PERMISSION_SHAPE,
  typeof WORKSPACE_PLANE
>;
