import { HEALTH_API_TAG } from '#/modules/health/index.js';
import { USER_AUTH_API_TAG } from '#/modules/user-auth/constants/index.js';

import type { ApiTag } from '../documentation.types.js';

/**
 * Sidebar ordering, per surface.
 *
 * Tag *names* belong to the module that owns them — a module decides what it is
 * called, and `@ApiTags(HEALTH_API_TAG.name)` keeps the string out of the
 * controller. Only the *order* is central, because ordering is inherently a
 * decision about the whole document and cannot be made from inside one module.
 *
 * Registering a module here is one import and one array entry. Forgetting to is
 * harmless: its routes still appear, grouped under an untitled tag at the end —
 * visibly wrong rather than silently missing.
 */
export const USER_API_TAGS: readonly ApiTag[] = [HEALTH_API_TAG, USER_AUTH_API_TAG];

export const ADMIN_API_TAGS: readonly ApiTag[] = [];
