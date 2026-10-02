import {
  BadRequestException,
  type CanActivate,
  type ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { z } from 'zod';

import { AUTH_PUBLIC_METADATA } from '#/core/auth/index.js';
import { RequestContextService } from '#/core/context/index.js';
import { AppLoggerService } from '#/core/logger/index.js';
import { API_AUDIENCE, WORKSPACE_ID_HEADER } from '#/shared/constants/index.js';
import { idSchema } from '#/shared/schemas/index.js';
import { resolveApiAudience } from '#/shared/utils/index.js';

import {
  TENANCY_ERROR_MESSAGE,
  TENANCY_LOG_CONTEXT,
  TENANCY_NO_WORKSPACE_METADATA,
  WORKSPACE_ACCESS_REFUSAL,
  type WorkspaceAccessDenial,
} from '../constants/index.js';
import { WorkspaceAccessResolver } from '../ports/index.js';

/** Validated like a path id, so a malformed header is the same 422 with `validationErrors`. */
const workspaceIdHeaderSchema = z.object({ [WORKSPACE_ID_HEADER]: idSchema });

/**
 * Puts every user request that is not exempt inside one workspace, or refuses
 * it. Runs after `ApiAuthGuard`, which supplies the user.
 *
 * Required by default, as authentication is: a user route opts out with
 * `@NoWorkspace()`. The other way round, a route that forgot to opt in would
 * run with no tenant and no error.
 *
 * Admin routes are not tenant routes — an admin addresses a workspace by path
 * — so the header is ignored there.
 */
@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(
    private readonly resolver: WorkspaceAccessResolver,
    private readonly requestContext: RequestContextService,
    private readonly logger: AppLoggerService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.isExempt(context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<FastifyRequest>();

    const routePath = request.routeOptions.url;

    if (routePath === undefined) {
      throw new Error('Tenancy is mis-wired: the route could not be resolved');
    }

    if (resolveApiAudience(routePath) !== API_AUDIENCE.USER) {
      return true;
    }

    const userId = this.requestContext.userId;

    if (userId === undefined) {
      throw new Error('Tenancy is mis-wired: no user in context — WorkspaceGuard ran before auth');
    }

    const workspaceId = this.readWorkspaceId(request);

    if (workspaceId === undefined) {
      throw new BadRequestException(TENANCY_ERROR_MESSAGE.WORKSPACE_REQUIRED);
    }

    const result = await this.resolver.resolve(workspaceId, userId);

    if (!result.ok) {
      this.refuse(result.reason, workspaceId, userId);
    }

    this.requestContext.setIdentity({ workspaceId, memberId: result.memberId });

    return true;
  }

  private isExempt(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];

    return (
      this.reflector.getAllAndOverride<boolean>(AUTH_PUBLIC_METADATA, targets) === true ||
      this.reflector.getAllAndOverride<boolean>(TENANCY_NO_WORKSPACE_METADATA, targets) === true
    );
  }

  private readWorkspaceId(request: FastifyRequest): string | undefined {
    const value = request.headers[WORKSPACE_ID_HEADER];

    if (value === undefined) {
      return undefined;
    }

    return workspaceIdHeaderSchema.parse({ [WORKSPACE_ID_HEADER]: value })[WORKSPACE_ID_HEADER];
  }

  private refuse(reason: WorkspaceAccessDenial, workspaceId: string, userId: string): never {
    const refusal = WORKSPACE_ACCESS_REFUSAL[reason];

    this.logger.warn('Refused a request for a workspace', {
      context: TENANCY_LOG_CONTEXT,
      operation: 'canActivate',
      metadata: { reason, workspaceId, userId },
    });

    throw new HttpException(refusal.message, refusal.status);
  }
}
