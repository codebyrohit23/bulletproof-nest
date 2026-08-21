/**
 * Request context — ambient identity for the current unit of work.
 *
 * Carries: requestId, correlationId, locale, timezone, ip, userAgent, clientId,
 * and once authentication has run, userId / workspaceId / sessionId.
 *
 * Does NOT do: logging, validation, caching, database access, authorisation.
 * It only holds values other layers put in and read out.
 *
 * The storage instance is intentionally not exported — inject
 * `RequestContextService` instead.
 *
 * ---------------------------------------------------------------------------
 * PLANNED — deliberately not built yet
 * ---------------------------------------------------------------------------
 * These belong to this module but have no consumer today. Build each one when
 * the module named against it lands; do not create them earlier.
 *
 *   interfaces/current-user.interface.ts   WITH core/auth
 *     Today the context holds `userId` only, which is all anything needs. When
 *     RBAC arrives, guards need roles and permissions on every request without
 *     re-querying. That is when `CurrentUser` becomes an object and
 *     `@CurrentUserId()` gains a `@CurrentUser()` sibling.
 *
 *   interfaces/tenant.interface.ts         WITH modules/workspaces
 *     Same reasoning for `workspaceId`. Becomes an object once callers need
 *     the plan, feature flags or limits of the active workspace inline.
 *
 *   interfaces/trace-context.interface.ts  WITH OpenTelemetry
 *     traceId / spanId / traceFlags, parsed from the W3C `traceparent` header.
 *     Not added now because the OTel SDK auto-instruments and already
 *     propagates its own context — adding fields here first would duplicate it.
 *
 *   constants/context.tokens.ts            ONLY IF a custom provider appears
 *     `RequestContextService` is a plain class, so it is its own injection
 *     token. A tokens file would be indirection with nothing behind it.
 *
 * ---------------------------------------------------------------------------
 * Deliberately merged rather than split
 * ---------------------------------------------------------------------------
 *   services/    one service, not three. `context` / `request-context` /
 *                `context-storage` would be the same object under three names,
 *                forcing a reader to open all three to learn which to inject.
 *                The AsyncLocalStorage instance is separated into `storage/`
 *                because parameter decorators cannot use DI and must reach it.
 *
 *   middleware/  one middleware, not three. request-id and correlation-id both
 *                read a header and write one field; splitting them would mean
 *                three passes over the same headers and three chances for the
 *                order to drift.
 */

export { ContextModule } from './context.module.js';

export { RequestContextService } from './services/request-context.service.js';

export {
  CorrelationId,
  CurrentContext,
  CurrentWorkspaceId,
  CurrentUserId,
  Locale,
  RequestId,
} from './decorators/index.js';

export {
  CORRELATION_ID_HEADER,
  DEFAULT_LOCALE,
  REQUEST_ID_HEADER,
  RESPONSE_REQUEST_ID_HEADER,
} from './constants/context.constants.js';

/**
 * Exported for the composition root only: it is wired into the Fastify
 * adapter's `genReqId`, which is constructed before the DI container exists and
 * so cannot inject `RequestContextService`.
 */
export { resolveRequestId } from './utils/request-id.util.js';

export type { RequestContext, RequestIdentityPatch } from './interfaces/index.js';
