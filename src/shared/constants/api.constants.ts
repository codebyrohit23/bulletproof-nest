export const API_PREFIX = 'api';

export const API_VERSION_PREFIX = 'v' as const;

export const ApiVersion = {
  V1: '1',
} as const;

export const API_AUDIENCE = {
  USER: 'user',

  ADMIN: 'admin',
} as const;

export type ApiAudienceKey = (typeof API_AUDIENCE)[keyof typeof API_AUDIENCE];

export const ADMIN_PATH_SEGMENT = '/admin/';
