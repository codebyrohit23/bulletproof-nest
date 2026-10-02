export interface RequestGeo {
  countryCode?: string;

  region?: string;

  city?: string;
}

export interface ClientHints {
  platform?: string;

  platformVersion?: string;

  mobile?: boolean;

  model?: string;
}

export interface RequestContext {
  requestId: string;

  correlationId: string;

  locale: string;

  ip?: string;

  userAgent?: string;

  timezone?: string;

  deviceId?: string;

  geo?: RequestGeo;

  clientHints?: ClientHints;

  userId?: string;

  adminId?: string;

  workspaceId?: string;

  /** The caller's membership in `workspaceId`. Set together with it, by the tenant guard. */
  memberId?: string;

  sessionId?: string;
}

export type RequestIdentityPatch = Pick<
  RequestContext,
  'userId' | 'adminId' | 'workspaceId' | 'memberId' | 'sessionId'
>;
