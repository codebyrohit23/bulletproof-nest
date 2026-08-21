import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import type { RequestContext } from '../interfaces/index.js';
import { requestContextStorage } from '../storage/request-context.storage.js';

/**
 * Controller parameter decorators.
 *
 * They read the AsyncLocalStorage directly rather than a service, because
 * `createParamDecorator` runs outside dependency injection. That is also why
 * the storage is a module-level instance.
 *
 * All of them return `undefined` outside a request rather than throwing —
 * enforcing that a user or tenant is present is the job of a guard, not a
 * decorator. A decorator that throws turns a missing guard into a confusing
 * 500 instead of an honest 401.
 */

export const CurrentContext = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): Readonly<RequestContext> | undefined =>
    requestContextStorage.getStore(),
);

export const CurrentUserId = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): string | undefined =>
    requestContextStorage.getStore()?.userId,
);

/**
 * The active tenant. Never read the workspace from a request body or a
 * route parameter — only from here, where it came from a verified session.
 */
export const CurrentWorkspaceId = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): string | undefined =>
    requestContextStorage.getStore()?.workspaceId,
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
