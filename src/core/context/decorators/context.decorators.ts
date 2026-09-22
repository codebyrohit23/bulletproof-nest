import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { IdentityMissingException } from '../exceptions/index.js';
import type { RequestContext } from '../interfaces/index.js';
import { requestContextStorage } from '../storage/request-context.storage.js';

const requireIdentity = (field: 'userId' | 'adminId' | 'sessionId') =>
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

export const CurrentContext = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): Readonly<RequestContext> | undefined =>
    requestContextStorage.getStore(),
);

export const CurrentWorkspaceId = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): string | undefined =>
    requestContextStorage.getStore()?.workspaceId,
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
