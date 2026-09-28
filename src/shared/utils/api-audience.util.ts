import {
  ADMIN_PATH_SEGMENT,
  API_AUDIENCE,
  API_PREFIX,
  API_VERSION_PREFIX,
  type ApiAudienceKey,
} from '../constants/index.js';

/**
 * Admin is the first segment after the prefix and the optional version —
 * `/api/v1/admin/…` or `/api/admin/…` — never an `admin` segment further in.
 * A substring match would have turned a user route such as
 * `/api/v1/workspaces/:id/admin/settings` into an admin one, and missed
 * `/api/v1/admin` itself, which has no trailing slash.
 */
const ADMIN_ROUTE_PATTERN = new RegExp(
  `^/${API_PREFIX}(?:/${API_VERSION_PREFIX}[^/]+)?/${ADMIN_PATH_SEGMENT}(?:/|$)`,
);

export function resolveApiAudience(routePath: string): ApiAudienceKey {
  return ADMIN_ROUTE_PATTERN.test(routePath) ? API_AUDIENCE.ADMIN : API_AUDIENCE.USER;
}
