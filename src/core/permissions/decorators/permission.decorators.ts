import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiExtension } from '@nestjs/swagger';

import type { AdminPermissionKey, WorkspacePermissionKey } from '../catalogue/index.js';
import { PERMISSION_METADATA, PERMISSION_OPENAPI_EXTENSION } from '../constants/index.js';

/**
 * The four authorization markers. Every non-public route carries exactly one
 * of these or `@NoWorkspace()`, and the process refuses to start otherwise.
 *
 * All four are `MethodDecorator`s, so putting one on a controller class is a
 * compile error. A class-level key beside a method-level marker would leave
 * which one wins to the reader of the route; per route, there is no question.
 * The audit refuses a class-level marker that got there by a cast.
 *
 * The key parameters are the branded types, so a workspace key on
 * `@RequireAdminPermission` — or the reverse — does not compile, although both
 * catalogues spell `workspace.read`.
 */

/** A tenant route the caller's roles must grant `key` for. */
export function RequirePermission(key: WorkspacePermissionKey): MethodDecorator {
  return applyDecorators(
    SetMetadata(PERMISSION_METADATA.WORKSPACE_KEY, key),
    ApiExtension(PERMISSION_OPENAPI_EXTENSION, key),
  );
}

export function RequireAdminPermission(key: AdminPermissionKey): MethodDecorator {
  return applyDecorators(
    SetMetadata(PERMISSION_METADATA.ADMIN_KEY, key),
    ApiExtension(PERMISSION_OPENAPI_EXTENSION, key),
  );
}

export function AnyMember(): MethodDecorator {
  return SetMetadata(PERMISSION_METADATA.ANY_MEMBER, true);
}

export function AnyAdmin(): MethodDecorator {
  return SetMetadata(PERMISSION_METADATA.ANY_ADMIN, true);
}
