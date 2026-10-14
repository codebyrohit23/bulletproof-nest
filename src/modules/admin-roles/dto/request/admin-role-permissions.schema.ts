import { z } from 'zod';

import { ADMIN_PERMISSION_CATALOGUE } from '#/core/permissions/index.js';

/**
 * The permissions an admin role grants, as a request names them: catalogue
 * keys, no repeats. An unknown key is a 422 here; a restricted key passes and
 * is refused by the service, which can say why.
 */
export const adminRolePermissionsSchema = z
  .array(z.enum(ADMIN_PERMISSION_CATALOGUE.keys as unknown as [string, ...string[]]))
  .refine((keys) => new Set(keys).size === keys.length, {
    message: 'List each permission once',
  })
  .describe('Permission keys from `GET /admin/permissions`. Replaces the role’s set.');
