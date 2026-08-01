/**
 * Inbound headers the request context is built from.
 *
 * These live here rather than in the logger because the context is what reads
 * them off the wire; the logger is one of several consumers.
 */
export const REQUEST_ID_HEADER = 'x-request-id';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export const CLIENT_ID_HEADER = 'x-client-id';

export const TIMEZONE_HEADER = 'x-timezone';

export const FORWARDED_FOR_HEADER = 'x-forwarded-for';

export const LOCALE_HEADER = 'accept-language';

export const USER_AGENT_HEADER = 'user-agent';

/**
 * Echoed back on every response so a client can quote it in a bug report.
 */
export const RESPONSE_REQUEST_ID_HEADER = 'x-request-id';

export const DEFAULT_LOCALE = 'en';

export const CONTEXT_LOG_CONTEXT = 'RequestContext';
