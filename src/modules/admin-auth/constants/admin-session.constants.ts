import { type Prisma, SessionRevokeReason } from '@prisma/client';

export const ADMIN_SESSION_SNAPSHOT_SELECT = {
  id: true,
  adminId: true,
  deviceId: true,
  expiresAt: true,
  revokedAt: true,
  lastActivityAt: true,
} as const satisfies Prisma.AdminSessionSelect;

export const ADMIN_SESSION_LIST_STATUS = {
  ACTIVE: 'active',

  ENDED: 'ended',

  ALL: 'all',
} as const;

export type AdminSessionListStatus =
  (typeof ADMIN_SESSION_LIST_STATUS)[keyof typeof ADMIN_SESSION_LIST_STATUS];

export const ADMIN_SESSION_STATUS = {
  ACTIVE: 'ACTIVE',

  ENDED: 'ENDED',
} as const;

export type AdminSessionStatus = (typeof ADMIN_SESSION_STATUS)[keyof typeof ADMIN_SESSION_STATUS];

export const ADMIN_SESSION_END_REASON = {
  SIGNED_OUT: 'SIGNED_OUT',

  SIGNED_OUT_REMOTELY: 'SIGNED_OUT_REMOTELY',

  ENDED_BY_ADMIN: 'ENDED_BY_ADMIN',

  PASSWORD_CHANGED: 'PASSWORD_CHANGED',

  PASSWORD_RESET: 'PASSWORD_RESET',

  SECURITY_ALERT: 'SECURITY_ALERT',

  REPLACED: 'REPLACED',

  EXPIRED: 'EXPIRED',
} as const;

export type AdminSessionEndReason =
  (typeof ADMIN_SESSION_END_REASON)[keyof typeof ADMIN_SESSION_END_REASON];

export const ADMIN_SESSION_END_REASON_BY_REVOKE_REASON = {
  [SessionRevokeReason.LOGOUT]: ADMIN_SESSION_END_REASON.SIGNED_OUT,

  [SessionRevokeReason.USER_REVOKED]: ADMIN_SESSION_END_REASON.SIGNED_OUT_REMOTELY,

  [SessionRevokeReason.ADMIN_REVOKED]: ADMIN_SESSION_END_REASON.ENDED_BY_ADMIN,

  [SessionRevokeReason.PASSWORD_CHANGED]: ADMIN_SESSION_END_REASON.PASSWORD_CHANGED,

  [SessionRevokeReason.PASSWORD_RESET]: ADMIN_SESSION_END_REASON.PASSWORD_RESET,

  [SessionRevokeReason.TOKEN_REUSE_DETECTED]: ADMIN_SESSION_END_REASON.SECURITY_ALERT,

  [SessionRevokeReason.SUPERSEDED]: ADMIN_SESSION_END_REASON.REPLACED,
} as const satisfies Record<SessionRevokeReason, AdminSessionEndReason>;

export const ADMIN_SESSION_HISTORY_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

export const ADMIN_SESSION_SUMMARY_SELECT = {
  id: true,
  deviceName: true,
  browserName: true,
  browserVersion: true,
  osName: true,
  osVersion: true,
  city: true,
  region: true,
  countryCode: true,
  lastActivityAt: true,
  createdAt: true,
  expiresAt: true,
  revokedAt: true,
  revokedReason: true,
} as const satisfies Prisma.AdminSessionSelect;
