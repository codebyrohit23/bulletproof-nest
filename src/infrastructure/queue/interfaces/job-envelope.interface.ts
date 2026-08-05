import type { RequestContext } from '@/core/context/index.js';

/**
 * What is actually stored in Redis for a job.
 *
 * The payload is wrapped rather than stored bare because a job crosses a
 * process boundary: the AsyncLocalStorage context that existed when it was
 * dispatched is gone by the time a worker picks it up, possibly minutes later
 * on another machine.
 *
 * Without the snapshot, a tenant-scoped job has no organization — and in this
 * codebase that is not a subtle degradation: `CacheService.key()` throws, and
 * no log line can be traced back to the request that created the job.
 */
export interface JobEnvelope<TPayload> {
  readonly payload: TPayload;

  /**
   * Captured at dispatch, restored before the handler runs.
   *
   * Only the identity fields travel — `ip` and `userAgent` describe an HTTP
   * request that no longer exists and would be misleading in a worker's logs.
   */
  readonly context: JobContextSnapshot;

  readonly dispatchedAt: string;
}

export type JobContextSnapshot = Pick<
  RequestContext,
  'requestId' | 'correlationId' | 'organizationId' | 'userId' | 'locale'
>;
