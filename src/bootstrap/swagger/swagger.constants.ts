import { HEALTH_API_TAG } from '#/modules/health/index.js';

import type { ApiTag } from './interfaces/index.js';

/**
 * Where the two API surfaces are served.
 *
 * Separate documents rather than one with tags: the mobile app and the admin
 * app are different consumers. A single document would generate an SDK
 * containing admin endpoints the mobile app must never call, and would publish
 * the entire admin surface to anyone who opens `/docs`.
 */
export const SWAGGER_PATH = {
  USER: 'docs',
  ADMIN: 'docs/admin',
} as const;

/**
 * Named security schemes, referenced by `@ApiBearerAuth(...)` on controllers.
 *
 * Separate per audience so each document's "Authorize" button asks for the
 * right credential — an admin token is not a user token.
 */
export const SWAGGER_SECURITY = {
  USER: 'user-access-token',
  ADMIN: 'admin-access-token',
} as const;

/**
 * **The sidebar order.**
 *
 * Swagger UI renders tags in the order `addTag()` declares them, and that is
 * the only thing standing between you and an alphabetised wall of 200
 * endpoints. This array is the one place that order is decided.
 *
 * Tag *names* live with their module — a module owns what it is called. Only
 * the ordering is central, because ordering is inherently a global decision.
 *
 * Adding a module is one import and one entry here.
 */
export const USER_API_TAGS: readonly ApiTag[] = [HEALTH_API_TAG];

export const ADMIN_API_TAGS: readonly ApiTag[] = [];

/**
 * Marks an admin route. The document filter splits on this, so it must match
 * the path segment used by admin controllers.
 */
export const ADMIN_PATH_SEGMENT = '/admin/';
