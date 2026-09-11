export const REQUEST_ID_HEADER = 'x-request-id';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export const DEVICE_ID_HEADER = 'x-device-id';

/**
 * The workspace a request is acting in.
 *
 * Read by nothing yet — the workspace guard that consumes it lands with
 * `modules/workspaces`. It is declared here now because CORS has to permit the
 * header before any client can send it, and a name defined in two places is a
 * name that eventually disagrees with itself.
 *
 * **A hint, never proof.** Whoever can send a bearer token can send this header
 * naming any workspace at all. The guard must resolve it against the caller's
 * membership and refuse otherwise; see `RequestContext.workspaceId`.
 */
export const WORKSPACE_ID_HEADER = 'x-workspace-id';

export const TIMEZONE_HEADER = 'x-timezone';

export const FORWARDED_FOR_HEADER = 'x-forwarded-for';

export const LOCALE_HEADER = 'accept-language';

export const USER_AGENT_HEADER = 'user-agent';

export const GEO_COUNTRY_HEADER = 'cf-ipcountry';

export const GEO_REGION_HEADER = 'cf-region';

export const GEO_CITY_HEADER = 'cf-ipcity';

export const CLIENT_HINT_HEADER = {
  PLATFORM: 'sec-ch-ua-platform',

  PLATFORM_VERSION: 'sec-ch-ua-platform-version',

  MOBILE: 'sec-ch-ua-mobile',

  MODEL: 'sec-ch-ua-model',
} as const;

export const RESPONSE_REQUEST_ID_HEADER = 'x-request-id';

export const ACCEPT_CH_HEADER = 'accept-ch';

export const ACCEPT_CH_VALUE = 'Sec-CH-UA-Platform-Version, Sec-CH-UA-Model';

export const DEFAULT_LOCALE = 'en';

export const DEVICE_ID_MAX_LENGTH = 255;

export const GEO_COUNTRY_CODE_LENGTH = 2;

export const GEO_NAME_MAX_LENGTH = 100;

export const GEO_UNKNOWN_COUNTRY_CODES: readonly string[] = ['XX', 'T1'];

export const CONTEXT_LOG_CONTEXT = 'RequestContext';
