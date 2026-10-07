import type { AdminPermissionKey, WorkspacePermissionKey } from '../catalogue/index.js';

export interface RouteMarkers {
  readonly isPublic: boolean;

  readonly noWorkspace: boolean;

  readonly anyMember: boolean;

  readonly anyAdmin: boolean;

  readonly workspaceKey: string | undefined;

  readonly adminKey: string | undefined;

  readonly onController: readonly string[];
}

export type RouteRequirement =
  | { readonly kind: 'public' }
  | { readonly kind: 'authenticated' }
  | { readonly kind: 'workspace'; readonly key: WorkspacePermissionKey }
  | { readonly kind: 'admin'; readonly key: AdminPermissionKey };

export type RouteRequirementResult =
  | { readonly ok: true; readonly requirement: RouteRequirement }
  | { readonly ok: false; readonly fault: string };
