export const CSRF_LOG_CONTEXT = 'Csrf';

export const CSRF_SKIP_METADATA = 'csrf:skip';

export const FETCH_SITE_HEADER = 'sec-fetch-site';

export const ORIGIN_HEADER = 'origin';

export const FETCH_SITE = {
  SAME_ORIGIN: 'same-origin',
  SAME_SITE: 'same-site',
  CROSS_SITE: 'cross-site',
  NONE: 'none',
} as const;

export const CSRF_SAFE_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);

export const CSRF_FAILURE_REASON = {
  CROSS_SITE: 'CROSS_SITE',

  UNTRUSTED_ORIGIN: 'UNTRUSTED_ORIGIN',
} as const;

export type CsrfFailureReason = (typeof CSRF_FAILURE_REASON)[keyof typeof CSRF_FAILURE_REASON];

export const CSRF_ERROR_MESSAGE = {
  FORBIDDEN: 'Request rejected.',
} as const;

export const WILDCARD_ORIGIN = '*';

export const HTTP_CONTEXT = 'http';
