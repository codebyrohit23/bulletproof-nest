import { Injectable } from '@nestjs/common';

import type { RequestContext, RequestIdentityPatch } from '../interfaces/index.js';
import { requestContextStorage } from '../storage/request-context.storage.js';

/**
 * Per-request memo, keyed by the request's context object, so an entry lives
 * exactly as long as the request and is collected with it. A WeakMap rather
 * than a field on `RequestContext`, which is a plain data shape the logger and
 * jobs serialise.
 */
const requestMemos = new WeakMap<RequestContext, Map<string, Promise<unknown>>>();

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

  get memberId(): string | undefined {
    return requestContextStorage.getStore()?.memberId;
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

  /**
   * Runs `loader` once per request for `key`; later calls in the same request
   * share its promise. For reads that several guards make on every request —
   * the tenant and permission guards both need the membership snapshot.
   *
   * Outside a request (a job, the seed script) it just calls `loader`. A
   * failed load is not remembered. A caller that writes what it memoised must
   * `forget` the key, or the rest of the request reads the old value.
   */
  memo<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const context = requestContextStorage.getStore();

    if (context === undefined) {
      return loader();
    }

    let entries = requestMemos.get(context);

    if (entries === undefined) {
      entries = new Map();

      requestMemos.set(context, entries);
    }

    const cached = entries.get(key);

    if (cached !== undefined) {
      return cached as Promise<T>;
    }

    const loading = loader();

    entries.set(key, loading);

    loading.catch(() => entries.delete(key));

    return loading;
  }

  forget(key: string): void {
    const context = requestContextStorage.getStore();

    if (context !== undefined) {
      requestMemos.get(context)?.delete(key);
    }
  }

  setIdentity(patch: RequestIdentityPatch): void {
    const context = requestContextStorage.getStore();

    if (context === undefined) {
      return;
    }

    Object.assign(context, patch);
  }
}
