import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { IdentityMissingException } from '../exceptions/index.js';
import type { RequestContext } from '../interfaces/index.js';
import { requestContextStorage } from '../storage/request-context.storage.js';

const requireIdentity = (field: 'userId' | 'adminId' | 'sessionId' | 'workspaceId' | 'memberId') =>
  createParamDecorator((_data: unknown, _ctx: ExecutionContext): string => {
    const value = requestContextStorage.getStore()?.[field];

    if (value === undefined) {
      throw new IdentityMissingException(field);
    }

    return value;
  });

export const CurrentUserId = requireIdentity('userId');

export const CurrentAdminId = requireIdentity('adminId');

export const CurrentSessionId = requireIdentity('sessionId');

/**
 * Required, like the identities above: a route that reads the workspace and
 * finds none was marked `@NoWorkspace()` by mistake, and should fail rather
 * than run its query with `undefined`.
 */
export const CurrentWorkspaceId = requireIdentity('workspaceId');

export const CurrentMemberId = requireIdentity('memberId');

export const CurrentContext = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): Readonly<RequestContext> | undefined =>
    requestContextStorage.getStore(),
);

export const CurrentDeviceId = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): string | undefined =>
    requestContextStorage.getStore()?.deviceId,
);

export const RequestId = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): string | undefined =>
    requestContextStorage.getStore()?.requestId,
);

export const CorrelationId = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): string | undefined =>
    requestContextStorage.getStore()?.correlationId,
);

export const Locale = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): string | undefined =>
    requestContextStorage.getStore()?.locale,
);
