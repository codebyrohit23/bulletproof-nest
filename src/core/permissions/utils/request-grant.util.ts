import type { AdminGrant, WorkspaceGrant } from '../interfaces/index.js';

/**
 * The grant `PermissionGuard` resolved for a request, kept for the handler.
 *
 * A route that changes roles needs the caller's permissions for the
 * no-escalation check. Resolving them again would cost a second read and — in
 * `modules/workspace-roles` — need the resolver, which lives in the module
 * that imports it. The guard has the answer already; this hands it on.
 *
 * Keyed by the request object in a WeakMap, so the entry lives exactly as long
 * as the request and nothing is added to the request's own shape.
 */
const workspaceGrants = new WeakMap<object, WorkspaceGrant>();

const adminGrants = new WeakMap<object, AdminGrant>();

export function keepWorkspaceGrant(request: object, grant: WorkspaceGrant): void {
  workspaceGrants.set(request, grant);
}

export function keepAdminGrant(request: object, grant: AdminGrant): void {
  adminGrants.set(request, grant);
}

export function keptWorkspaceGrant(request: object): WorkspaceGrant | undefined {
  return workspaceGrants.get(request);
}

export function keptAdminGrant(request: object): AdminGrant | undefined {
  return adminGrants.get(request);
}
