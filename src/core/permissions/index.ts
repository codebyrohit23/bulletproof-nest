export { PermissionsModule } from './permissions.module.js';

export {
  AnyAdmin,
  AnyMember,
  RequireAdminPermission,
  RequirePermission,
} from './decorators/permission.decorators.js';

export { AdminPermissionResolver, WorkspacePermissionResolver } from './ports/index.js';

export {
  ADMIN_PERMISSION,
  ADMIN_PERMISSION_CATALOGUE,
  WORKSPACE_DEFAULT_ROLE,
  WORKSPACE_PERMISSION,
  WORKSPACE_PERMISSION_CATALOGUE,
  type AdminPermissionKey,
  type PermissionCatalogue,
  type PermissionEntry,
  type WorkspaceDefaultRoleKey,
  type WorkspacePermissionKey,
} from './catalogue/index.js';

export {
  PERMISSION_ERROR_MESSAGE,
  PERMISSION_OPENAPI_EXTENSION,
  PERMISSIONS_LOG_CONTEXT,
} from './constants/index.js';

export {
  planPermissionMirror,
  type PermissionMirrorPlan,
  type PermissionMirrorRow,
} from './utils/permission-mirror.util.js';

export type {
  AdminGrant,
  PermissionsModuleOptions,
  WorkspaceGrant,
  WorkspaceGrantSubject,
} from './interfaces/index.js';
