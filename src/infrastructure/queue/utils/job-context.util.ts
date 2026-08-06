import { uuidv7 } from 'uuidv7';

import { DEFAULT_LOCALE, type RequestContext } from '#/core/context/index.js';

import type { JobContextSnapshot } from '../interfaces/index.js';

/**
 * Moving request identity across a process boundary. Pure — no DI, no Redis.
 */

/**
 * Snapshots the identity worth carrying into a job.
 *
 * Only identity travels. `ip` and `userAgent` describe an HTTP request that no
 * longer exists by the time a worker runs, and carrying them would put
 * misleading values in a worker's logs.
 *
 * A job dispatched with no context — from a cron tick or a seed script — still
 * gets a `requestId`, so its logs are traceable as a unit of work even though
 * no request created it.
 */
export function captureJobContext(context: Readonly<RequestContext> | undefined): JobContextSnapshot {
  if (context === undefined) {
    const requestId = uuidv7();

    return { requestId, correlationId: requestId, locale: DEFAULT_LOCALE };
  }

  return {
    requestId: context.requestId,
    correlationId: context.correlationId,
    locale: context.locale,
    ...(context.organizationId !== undefined ? { organizationId: context.organizationId } : {}),
    ...(context.userId !== undefined ? { userId: context.userId } : {}),
  };
}

/**
 * Rebuilds a request context for the worker.
 *
 * The `requestId` is regenerated and the original kept as `correlationId`: the
 * job is a distinct unit of work with its own lifetime and its own log lines,
 * but it must still be traceable back to the request that caused it. Reusing
 * the id would make two different things — one HTTP request and three retries
 * of a job — indistinguishable in the logs.
 */
export function restoreJobContext(snapshot: JobContextSnapshot): RequestContext {
  return {
    requestId: uuidv7(),
    correlationId: snapshot.correlationId,
    locale: snapshot.locale,
    ...(snapshot.organizationId !== undefined ? { organizationId: snapshot.organizationId } : {}),
    ...(snapshot.userId !== undefined ? { userId: snapshot.userId } : {}),
  };
}
