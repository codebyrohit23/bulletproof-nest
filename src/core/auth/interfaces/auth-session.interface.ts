import type { ModuleMetadata } from '@nestjs/common';

import type { AUTH_FAILURE_REASON } from '../constants/auth.constants.js';

export interface AuthenticatedUserSession {
  readonly id: string;

  readonly userId: string;
}

export interface AuthenticatedAdminSession {
  readonly id: string;

  readonly adminId: string;
}

export type SessionFailureReason =
  | typeof AUTH_FAILURE_REASON.SESSION_UNKNOWN
  | typeof AUTH_FAILURE_REASON.SESSION_REVOKED
  | typeof AUTH_FAILURE_REASON.SESSION_EXPIRED
  | typeof AUTH_FAILURE_REASON.SESSION_UNBOUND
  | typeof AUTH_FAILURE_REASON.DEVICE_MISMATCH;

export type UserSessionValidationResult =
  | { readonly ok: true; readonly session: AuthenticatedUserSession }
  | { readonly ok: false; readonly reason: SessionFailureReason };

export type AdminSessionValidationResult =
  | { readonly ok: true; readonly session: AuthenticatedAdminSession }
  | { readonly ok: false; readonly reason: SessionFailureReason };

export interface AuthModuleOptions {
  readonly imports: NonNullable<ModuleMetadata['imports']>;
}
