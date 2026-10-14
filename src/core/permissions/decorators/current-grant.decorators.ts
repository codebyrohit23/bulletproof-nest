import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { AdminGrant, WorkspaceGrant } from '../interfaces/index.js';
import { keptAdminGrant, keptWorkspaceGrant } from '../utils/request-grant.util.js';

/**
 * The caller's grant, as `PermissionGuard` resolved it for this request. Only
 * on a route marked `@RequirePermission` — the guard resolves a grant for
 * nothing else — and a route without one fails loudly rather than handing the
 * handler an empty set, which would read as "holds nothing" and refuse
 * everything for the wrong reason.
 */
export const CurrentWorkspaceGrant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): WorkspaceGrant => {
    const grant = keptWorkspaceGrant(context.switchToHttp().getRequest<object>());

    if (grant === undefined) {
      throw new Error(
        '@CurrentWorkspaceGrant() needs @RequirePermission() on the route — no grant was resolved',
      );
    }

    return grant;
  },
);

/** The admin plane's `CurrentWorkspaceGrant`; needs `@RequireAdminPermission()`. */
export const CurrentAdminGrant = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AdminGrant => {
    const grant = keptAdminGrant(context.switchToHttp().getRequest<object>());

    if (grant === undefined) {
      throw new Error(
        '@CurrentAdminGrant() needs @RequireAdminPermission() on the route — no grant was resolved',
      );
    }

    return grant;
  },
);
