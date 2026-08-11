import { Injectable } from '@nestjs/common';

import type { RequestContext, RequestIdentityPatch } from '../interfaces/index.js';
import { requestContextStorage } from '../storage/request-context.storage.js';

/**
 * The only supported way to read or extend the ambient request context.
 *
 * Inject this rather than importing the storage directly — the storage is an
 * implementation detail and is not exported from the module barrel.
 */
@Injectable()
export class RequestContextService {
  /**
   * Establishes a context for the duration of `callback`, including every
   * async continuation inside it.
   *
   * Used by the HTTP middleware, and later by BullMQ processors and cron tasks
   * which build the same shape without a request.
   */
  run<T>(context: RequestContext, callback: () => T): T {
    return requestContextStorage.run(context, callback);
  }

  /**
   * The full context, or `undefined` outside any request or job.
   *
   * Callers must handle `undefined` rather than assume a request: this service
   * is also reachable from startup code and from tests.
   */
  get(): Readonly<RequestContext> | undefined {
    return requestContextStorage.getStore();
  }

  get isActive(): boolean {
    return requestContextStorage.getStore() !== undefined;
  }

  get requestId(): string | undefined {
    return requestContextStorage.getStore()?.requestId;
  }

  get correlationId(): string | undefined {
    return requestContextStorage.getStore()?.correlationId;
  }

  get userId(): string | undefined {
    return requestContextStorage.getStore()?.userId;
  }

  get workspaceId(): string | undefined {
    return requestContextStorage.getStore()?.workspaceId;
  }

  get sessionId(): string | undefined {
    return requestContextStorage.getStore()?.sessionId;
  }

  get locale(): string | undefined {
    return requestContextStorage.getStore()?.locale;
  }

  /**
   * Fills in identity once authentication has run.
   *
   * Only identity fields can be patched — transport fields are fixed by the
   * middleware and must stay stable for the life of the request, otherwise a
   * log line and a response could disagree about which request they belong to.
   *
   * A no-op outside a context, so callers never need to guard.
   */
  setIdentity(patch: RequestIdentityPatch): void {
    const context = requestContextStorage.getStore();

    if (context === undefined) {
      return;
    }

    Object.assign(context, patch);
  }
}
