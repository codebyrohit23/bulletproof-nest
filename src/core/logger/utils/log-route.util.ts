import { LOGGER_QUIET_ROUTE_PATTERN } from '../logger.constants.js';

/**
 * Pure helpers shared by the serialisers and the `pino-http` options.
 * No DI, no framework types, no pino types.
 */

/**
 * Strips the query string from a URL.
 *
 * Reset tokens, invite tokens and e-mail addresses all travel in query values,
 * and redaction cannot reach them: a redact path names a key, while a query
 * value is identified only by its position in a string.
 */
export function extractPath(url: string | undefined): string {
  if (url === undefined) {
    return '';
  }

  const queryIndex = url.indexOf('?');

  return queryIndex === -1 ? url : url.slice(0, queryIndex);
}

/**
 * Whether the route is polled by infrastructure rather than requested by a
 * user. Such a route is worth a log line only when it fails.
 */
export function isQuietRoute(url: string | undefined): boolean {
  return LOGGER_QUIET_ROUTE_PATTERN.test(extractPath(url));
}
