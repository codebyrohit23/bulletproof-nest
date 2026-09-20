import { HttpStatus } from '@nestjs/common';

export const DOCS_PATH = {
  USER: '/docs',

  USER_SPEC: '/docs/json',

  ADMIN: '/docs/admin',

  ADMIN_SPEC: '/docs/admin/json',
} as const;

export const SECURITY_SCHEME = {
  USER: 'user-access-token',

  ADMIN: 'admin-access-token',
} as const;

export const SCHEMA_REF_PREFIX = '#/components/schemas/';

export const DOCUMENTATION_LOG_CONTEXT = 'Documentation';

export const ERROR_DESCRIPTION = {
  [HttpStatus.BAD_REQUEST]: 'The request was malformed.',
  [HttpStatus.UNAUTHORIZED]: 'No access token was supplied, or it was expired or invalid.',
  [HttpStatus.FORBIDDEN]: 'Authenticated, but not permitted to perform this action.',
  [HttpStatus.NOT_FOUND]: 'No such resource, or it is not visible to this workspace.',
  [HttpStatus.CONFLICT]: 'The request conflicts with the current state of the resource.',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'The request body failed validation. See `validationErrors`.',
  [HttpStatus.TOO_MANY_REQUESTS]:
    'Too many attempts. Wait, or start the flow again, before retrying.',
  [HttpStatus.INTERNAL_SERVER_ERROR]:
    'An unexpected error occurred. Quote `meta.requestId` when reporting it.',
} as const;
