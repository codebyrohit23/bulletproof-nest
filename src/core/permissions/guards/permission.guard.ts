import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';

import { RequestContextService } from '#/core/context/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import { resolveApiAudience } from '#/shared/utils/index.js';

import type { AdminPermissionKey, WorkspacePermissionKey } from '../catalogue/index.js';
import {
  PERMISSION_DENIAL_REASON,
  PERMISSION_ERROR_MESSAGE,
  PERMISSIONS_LOG_CONTEXT,
  type PermissionDenialReason,
} from '../constants/index.js';
import { AdminPermissionResolver, WorkspacePermissionResolver } from '../ports/index.js';
import { readRouteMarkers, resolveRouteRequirement } from '../utils/index.js';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly workspaceResolver: WorkspacePermissionResolver,
    private readonly adminResolver: AdminPermissionResolver,
    private readonly requestContext: RequestContextService,
    private readonly logger: AppLoggerService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const markers = readRouteMarkers(this.reflector, context.getHandler(), context.getClass());

    const routePath = context.switchToHttp().getRequest<FastifyRequest>().routeOptions.url;

    const audience = routePath === undefined ? undefined : resolveApiAudience(routePath);

    const result = resolveRouteRequirement(audience, markers);

    if (!result.ok) {
      throw this.wiringFault(result.fault, routePath);
    }

    const { requirement } = result;

    switch (requirement.kind) {
      case 'public':
      case 'authenticated':
        return true;

      case 'workspace':
        return this.authorizeMember(requirement.key);

      case 'admin':
        return this.authorizeAdmin(requirement.key);
    }
  }

  private async authorizeMember(key: WorkspacePermissionKey): Promise<true> {
    const { userId, workspaceId, memberId } = this.requestContext;

    if (userId === undefined || workspaceId === undefined || memberId === undefined) {
      throw this.wiringFault(
        'a workspace permission was required but no user, workspace or member is in context — ' +
          'PermissionGuard ran before ApiAuthGuard or WorkspaceGuard',
      );
    }

    const grant = await this.workspaceResolver.resolve({ workspaceId, memberId, userId });

    if (grant === null) {
      this.refuse(PERMISSION_DENIAL_REASON.GRANT_UNAVAILABLE, key, { userId, workspaceId });
    }

    if (!grant.permissions.has(key)) {
      this.refuse(PERMISSION_DENIAL_REASON.KEY_NOT_GRANTED, key, { userId, workspaceId });
    }

    return true;
  }

  private async authorizeAdmin(key: AdminPermissionKey): Promise<true> {
    const { adminId } = this.requestContext;

    if (adminId === undefined) {
      throw this.wiringFault(
        'an admin permission was required but no admin is in context — ' +
          'PermissionGuard ran before ApiAuthGuard',
      );
    }

    const grant = await this.adminResolver.resolve(adminId);

    if (grant === null) {
      this.refuse(PERMISSION_DENIAL_REASON.GRANT_UNAVAILABLE, key, { adminId });
    }

    if (!grant.permissions.has(key)) {
      this.refuse(PERMISSION_DENIAL_REASON.KEY_NOT_GRANTED, key, { adminId });
    }

    return true;
  }

  private refuse(
    reason: PermissionDenialReason,
    required: string,
    subject: Readonly<Record<string, string>>,
  ): never {
    this.logger.warn('Refused a request the caller has no permission for', {
      context: PERMISSIONS_LOG_CONTEXT,
      operation: 'canActivate',
      metadata: { reason, required, ...subject },
    });

    throw new ForbiddenException({ message: PERMISSION_ERROR_MESSAGE.DENIED, required });
  }

  private wiringFault(fault: string, routePath?: string): Error {
    const error = new Error(`Authorization is mis-wired: ${fault}`);

    this.logger.error(error, 'Refused a request this service could not authorize', {
      context: PERMISSIONS_LOG_CONTEXT,
      operation: 'canActivate',
      metadata: routePath === undefined ? {} : { routePath },
    });

    return error;
  }
}
