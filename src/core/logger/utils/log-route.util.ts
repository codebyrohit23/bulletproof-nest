import { LOGGER_QUIET_ROUTE_PATTERN } from '../constants/index.js';

export function extractPath(url: string | undefined): string {
  if (url === undefined) {
    return '';
  }

  const queryIndex = url.indexOf('?');

  return queryIndex === -1 ? url : url.slice(0, queryIndex);
}

export function isQuietRoute(url: string | undefined): boolean {
  return LOGGER_QUIET_ROUTE_PATTERN.test(extractPath(url));
}
