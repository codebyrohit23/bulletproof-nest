export const REQUEST_ID_HEADER = 'x-request-id';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export const DEVICE_ID_HEADER = 'x-device-id';

export const WORKSPACE_ID_HEADER = 'x-workspace-id';

export const TIMEZONE_HEADER = 'x-timezone';

/** Written by a proxy. Believed only as far as `TRUST_PROXY` says. */
export const FORWARDED_FOR_HEADER = 'x-forwarded-for';

export const LOCALE_HEADER = 'accept-language';

export const USER_AGENT_HEADER = 'user-agent';

/* --------------------------------------------------------------------------
 * Geo headers — set by the edge, never by the client
 * ----------------------------------------------------------------------- */

export const GEO_COUNTRY_HEADER = 'cf-ipcountry';

export const GEO_REGION_HEADER = 'cf-region';

export const GEO_CITY_HEADER = 'cf-ipcity';

/* --------------------------------------------------------------------------
 * Client Hints — set by the user agent, never by page script
 * ----------------------------------------------------------------------- */

export const CLIENT_HINT_HEADER = {
  PLATFORM: 'sec-ch-ua-platform',

  PLATFORM_VERSION: 'sec-ch-ua-platform-version',

  MOBILE: 'sec-ch-ua-mobile',

  MODEL: 'sec-ch-ua-model',
} as const;

/* --------------------------------------------------------------------------
 * Response headers
 * ----------------------------------------------------------------------- */

export const RESPONSE_REQUEST_ID_HEADER = 'x-request-id';

export const ACCEPT_CH_HEADER = 'accept-ch';

/** The two high-entropy hints this origin opts in to requesting. */
export const ACCEPT_CH_VALUE = 'Sec-CH-UA-Platform-Version, Sec-CH-UA-Model';

/**
 * Lowercase because Fastify normalises header names, and these are the
 * `RateLimit-*` fields HTTP clients and SDKs already know how to read.
 */
export const RATE_LIMIT_HEADER = {
  LIMIT: 'ratelimit-limit',

  REMAINING: 'ratelimit-remaining',

  RESET: 'ratelimit-reset',
} as const;

export const RETRY_AFTER_HEADER = 'retry-after';

export const CONTENT_DISPOSITION_HEADER = 'content-disposition';
