export const PERMISSIONS_LOG_CONTEXT = 'Permissions';

export const PERMISSION_METADATA = {
  WORKSPACE_KEY: 'permissions:workspace-key',

  ADMIN_KEY: 'permissions:admin-key',

  ANY_MEMBER: 'permissions:any-member',

  ANY_ADMIN: 'permissions:any-admin',
} as const;

export type PermissionMetadataKey = (typeof PERMISSION_METADATA)[keyof typeof PERMISSION_METADATA];

export const PERMISSION_OPENAPI_EXTENSION = 'x-required-permission';

export const PERMISSION_ERROR_MESSAGE = {
  DENIED: 'You do not have permission to do this.',
} as const;

export const PERMISSION_DENIAL_REASON = {
  KEY_NOT_GRANTED: 'KEY_NOT_GRANTED',

  GRANT_UNAVAILABLE: 'GRANT_UNAVAILABLE',
} as const;

export type PermissionDenialReason =
  (typeof PERMISSION_DENIAL_REASON)[keyof typeof PERMISSION_DENIAL_REASON];
