import { type Prisma, SessionRevokeReason } from '@prisma/client';

/** What `GET /auth/sessions?status=` accepts. `active` is the default, so the list reads as it always has. */
export const USER_SESSION_LIST_STATUS = {
  ACTIVE: 'active',

  ENDED: 'ended',

  ALL: 'all',
} as const;

export type UserSessionListStatus =
  (typeof USER_SESSION_LIST_STATUS)[keyof typeof USER_SESSION_LIST_STATUS];

export const USER_SESSION_STATUS = {
  ACTIVE: 'ACTIVE',

  ENDED: 'ENDED',
} as const;

export type UserSessionStatus = (typeof USER_SESSION_STATUS)[keyof typeof USER_SESSION_STATUS];

export const USER_SESSION_END_REASON = {
  SIGNED_OUT: 'SIGNED_OUT',

  SIGNED_OUT_REMOTELY: 'SIGNED_OUT_REMOTELY',

  ENDED_BY_SUPPORT: 'ENDED_BY_SUPPORT',

  PASSWORD_CHANGED: 'PASSWORD_CHANGED',

  PASSWORD_RESET: 'PASSWORD_RESET',

  SECURITY_ALERT: 'SECURITY_ALERT',

  REPLACED: 'REPLACED',

  EXPIRED: 'EXPIRED',
} as const;

export type UserSessionEndReason =
  (typeof USER_SESSION_END_REASON)[keyof typeof USER_SESSION_END_REASON];

/**
 * A revoke reason added to the schema without a public name here fails the
 * build, rather than reaching a client as `null`.
 */
export const USER_SESSION_END_REASON_BY_REVOKE_REASON = {
  [SessionRevokeReason.LOGOUT]: USER_SESSION_END_REASON.SIGNED_OUT,

  [SessionRevokeReason.USER_REVOKED]: USER_SESSION_END_REASON.SIGNED_OUT_REMOTELY,

  [SessionRevokeReason.ADMIN_REVOKED]: USER_SESSION_END_REASON.ENDED_BY_SUPPORT,

  [SessionRevokeReason.PASSWORD_CHANGED]: USER_SESSION_END_REASON.PASSWORD_CHANGED,

  [SessionRevokeReason.PASSWORD_RESET]: USER_SESSION_END_REASON.PASSWORD_RESET,

  [SessionRevokeReason.TOKEN_REUSE_DETECTED]: USER_SESSION_END_REASON.SECURITY_ALERT,

  [SessionRevokeReason.SUPERSEDED]: USER_SESSION_END_REASON.REPLACED,
} as const satisfies Record<SessionRevokeReason, UserSessionEndReason>;

/**
 * How far back ended sessions are listed.
 *
 * Sessions are never deleted, so without a window the history grows for the
 * life of the account. It is also a privacy bound: city, country and time
 * across every sign-in is a movement pattern, and this list is visible to
 * anyone holding a stolen session — the same reason it carries no IP address.
 */
export const USER_SESSION_HISTORY_WINDOW_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * The columns the sessions list reads. `ipAddress` is deliberately absent — see
 * `USER_SESSION_HISTORY_WINDOW_MS`. Must stay in step with `SessionSummaryRow`; the
 * repository's return type is where a mismatch fails to compile.
 */
export const USER_SESSION_SUMMARY_SELECT = {
  id: true,
  deviceName: true,
  deviceType: true,
  platform: true,
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
} as const satisfies Prisma.UserSessionSelect;
