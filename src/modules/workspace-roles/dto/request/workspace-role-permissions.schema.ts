import { z } from 'zod';

import { WORKSPACE_PERMISSION_CATALOGUE } from '#/core/permissions/index.js';

/**
 * The permissions a role grants, as a request names them: catalogue keys, no
 * repeats. Validated against the catalogue here, so an unknown key is a 422
 * with `validationErrors` before any service runs. Restricted keys pass this
 * schema and are refused by the service, which can say why.
 */
export const workspaceRolePermissionsSchema = z
  .array(z.enum(WORKSPACE_PERMISSION_CATALOGUE.keys as unknown as [string, ...string[]]))
  .refine((keys) => new Set(keys).size === keys.length, {
    message: 'List each permission once',
  })
  .describe('Permission keys from `GET /workspace/permissions`. Replaces the role’s set.');
