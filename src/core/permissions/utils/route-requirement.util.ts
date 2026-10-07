import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';

import { AUTH_PUBLIC_METADATA } from '#/core/auth/index.js';
import { TENANCY_NO_WORKSPACE_METADATA } from '#/core/tenancy/index.js';
import { API_AUDIENCE, type ApiAudienceKey } from '#/shared/constants/index.js';

import { ADMIN_PERMISSION_CATALOGUE, WORKSPACE_PERMISSION_CATALOGUE } from '../catalogue/index.js';
import { PERMISSION_METADATA } from '../constants/index.js';
import type { RouteMarkers, RouteRequirementResult } from '../interfaces/index.js';

type RouteHandler = ReturnType<ExecutionContext['getHandler']>;

type RouteController = ReturnType<ExecutionContext['getClass']>;

/** How each marker is named in a fault, as it is written on a route. */
const MARKER_LABEL = {
  noWorkspace: '@NoWorkspace()',
  anyMember: '@AnyMember()',
  workspaceKey: '@RequirePermission()',
  anyAdmin: '@AnyAdmin()',
  adminKey: '@RequireAdminPermission()',
} as const;

type MarkerName = keyof typeof MARKER_LABEL;

const ALLOWED_MARKERS = {
  [API_AUDIENCE.USER]: ['noWorkspace', 'anyMember', 'workspaceKey'],
  [API_AUDIENCE.ADMIN]: ['anyAdmin', 'adminKey'],
} as const satisfies Record<ApiAudienceKey, readonly MarkerName[]>;

/** Stands in for metadata that is present but not a string, so it fails the catalogue check. */
const INVALID_KEY = '<not a string>';

export function readRouteMarkers(
  reflector: Reflector,
  handler: RouteHandler,
  controller: RouteController,
): RouteMarkers {
  const targets = [handler, controller];

  return {
    isPublic: reflector.getAllAndOverride<unknown>(AUTH_PUBLIC_METADATA, targets) === true,

    noWorkspace:
      reflector.getAllAndOverride<unknown>(TENANCY_NO_WORKSPACE_METADATA, targets) === true,

    anyMember: reflector.get<unknown>(PERMISSION_METADATA.ANY_MEMBER, handler) === true,

    anyAdmin: reflector.get<unknown>(PERMISSION_METADATA.ANY_ADMIN, handler) === true,

    workspaceKey: readKey(reflector.get<unknown>(PERMISSION_METADATA.WORKSPACE_KEY, handler)),

    adminKey: readKey(reflector.get<unknown>(PERMISSION_METADATA.ADMIN_KEY, handler)),

    onController: Object.values(PERMISSION_METADATA).filter(
      (key) => reflector.get<unknown>(key, controller) !== undefined,
    ),
  };
}

/**
 * `audience` is `undefined` when the route path could not be resolved, which
 * is a fault for every route but a public one.
 */
export function resolveRouteRequirement(
  audience: ApiAudienceKey | undefined,
  markers: RouteMarkers,
): RouteRequirementResult {
  if (markers.onController.length > 0) {
    return fault(
      `permission metadata on the controller class (${markers.onController.join(', ')}) — ` +
        'put the marker on each route method',
    );
  }

  const present = presentMarkers(markers);

  if (markers.isPublic) {
    return present.length === 0
      ? { ok: true, requirement: { kind: 'public' } }
      : fault(`@Public() route also carries ${labels(present)}`);
  }

  if (audience === undefined) {
    return fault('the route path could not be resolved, so its audience is unknown');
  }

  const allowed: readonly MarkerName[] = ALLOWED_MARKERS[audience];

  if (present.length === 0) {
    return fault(
      `no authorization marker — a route of the ${audience} audience takes one of ${labels(allowed)}`,
    );
  }

  if (present.length > 1) {
    return fault(`more than one authorization marker: ${labels(present)}`);
  }

  const [marker] = present as [MarkerName];

  if (!allowed.includes(marker)) {
    return fault(
      `${MARKER_LABEL[marker]} on a route of the ${audience} audience — use one of ${labels(allowed)}`,
    );
  }

  switch (marker) {
    case 'noWorkspace':
    case 'anyMember':
    case 'anyAdmin':
      return { ok: true, requirement: { kind: 'authenticated' } };

    case 'workspaceKey':
      return toWorkspaceRequirement(markers.workspaceKey);

    case 'adminKey':
      return toAdminRequirement(markers.adminKey);
  }
}

function toWorkspaceRequirement(key: string | undefined): RouteRequirementResult {
  return key !== undefined && WORKSPACE_PERMISSION_CATALOGUE.has(key)
    ? { ok: true, requirement: { kind: 'workspace', key } }
    : fault(`@RequirePermission() names "${key}", which the workspace catalogue does not define`);
}

function toAdminRequirement(key: string | undefined): RouteRequirementResult {
  return key !== undefined && ADMIN_PERMISSION_CATALOGUE.has(key)
    ? { ok: true, requirement: { kind: 'admin', key } }
    : fault(`@RequireAdminPermission() names "${key}", which the admin catalogue does not define`);
}

function presentMarkers(markers: RouteMarkers): MarkerName[] {
  const set: Record<MarkerName, boolean> = {
    noWorkspace: markers.noWorkspace,
    anyMember: markers.anyMember,
    workspaceKey: markers.workspaceKey !== undefined,
    anyAdmin: markers.anyAdmin,
    adminKey: markers.adminKey !== undefined,
  };

  return (Object.keys(set) as MarkerName[]).filter((marker) => set[marker]);
}

function readKey(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return typeof value === 'string' ? value : INVALID_KEY;
}

function labels(markers: readonly MarkerName[]): string {
  return markers.map((marker) => MARKER_LABEL[marker]).join(', ');
}

function fault(message: string): RouteRequirementResult {
  return { ok: false, fault: message };
}
