import {
  definePermissionCatalogue,
  type PermissionCatalogueShape,
  type PermissionKeyOf,
} from './define-permission-catalogue.js';

const ADMIN_PERMISSION_SHAPE = {
  workspace: {
    read: {
      name: 'View workspaces',
      description: 'List and inspect every workspace on the platform.',
    },

    review: {
      name: 'Review workspaces',
      description: 'Approve or reject a workspace awaiting review.',
    },
  },

  admin: {
    read: {
      name: 'View admins',
      description: 'See the platform team, with their roles and status.',
    },

    create: {
      name: 'Create admins',
      description: 'Add someone to the platform team. Super admin only.',
      restricted: true,
    },

    update: {
      name: 'Update admins',
      description: 'Suspend or reactivate another admin.',
    },

    assignRoles: {
      name: 'Assign admin roles',
      description: 'Assign and remove another admin’s roles. Super admin only.',
      restricted: true,
    },
  },

  role: {
    read: {
      name: 'View admin roles',
      description: 'See the admin roles and what each one allows.',
    },

    manage: {
      name: 'Manage admin roles',
      description: 'Create, edit and delete admin roles. Super admin only.',
      restricted: true,
    },
  },
} as const satisfies PermissionCatalogueShape<never>;

const ADMIN_PLANE = 'admin';

const defined = definePermissionCatalogue(ADMIN_PLANE, ADMIN_PERMISSION_SHAPE);

/** `ADMIN_PERMISSION.workspace.review` — the key, typed to its plane. */
export const ADMIN_PERMISSION = defined.tree;

export const ADMIN_PERMISSION_CATALOGUE = defined.catalogue;

export type AdminPermissionKey = PermissionKeyOf<typeof ADMIN_PERMISSION_SHAPE, typeof ADMIN_PLANE>;
