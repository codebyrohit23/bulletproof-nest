import { Injectable } from '@nestjs/common';

import type { RequestContext, RequestIdentityPatch } from '../interfaces/index.js';
import { requestContextStorage } from '../storage/request-context.storage.js';

@Injectable()
export class RequestContextService {
  run<T>(context: RequestContext, callback: () => T): T {
    return requestContextStorage.run(context, callback);
  }

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

  get adminId(): string | undefined {
    return requestContextStorage.getStore()?.adminId;
  }

  get workspaceId(): string | undefined {
    return requestContextStorage.getStore()?.workspaceId;
  }

  get sessionId(): string | undefined {
    return requestContextStorage.getStore()?.sessionId;
  }

  get deviceId(): string | undefined {
    return requestContextStorage.getStore()?.deviceId;
  }

  get ip(): string | undefined {
    return requestContextStorage.getStore()?.ip;
  }

  get locale(): string | undefined {
    return requestContextStorage.getStore()?.locale;
  }

  setIdentity(patch: RequestIdentityPatch): void {
    const context = requestContextStorage.getStore();

    if (context === undefined) {
      return;
    }

    Object.assign(context, patch);
  }
}
