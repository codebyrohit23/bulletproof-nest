import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { RequestContext } from '../interfaces/index.js';
import { requestContextStorage } from '../storage/request-context.storage.js';

export const CurrentContext = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): Readonly<RequestContext> | undefined =>
    requestContextStorage.getStore(),
);

export const CurrentUserId = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): string | undefined =>
    requestContextStorage.getStore()?.userId,
);

export const CurrentAdminId = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): string | undefined =>
    requestContextStorage.getStore()?.adminId,
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
