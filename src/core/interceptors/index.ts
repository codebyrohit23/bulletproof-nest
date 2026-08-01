/**
 * Global interceptors.
 *
 * Two today: the response envelope and the request timeout. Each lives in its
 * own folder with everything it needs — interface, builder, decorators — so
 * changing the envelope means opening one folder, not four.
 *
 * Does NOT own:
 *   validation   → core/validation   (a pipe, a different mechanism)
 *   errors       → core/exceptions   (a filter, the other half of the contract)
 *   identity     → core/context      (also used by jobs, which have no request)
 *   logging      → core/logger       (pino autoLogging already covers requests)
 *   pagination   → shared/pagination
 *   ResponseMeta → shared/response   (shared with the error envelope)
 *   routes       → modules/
 *
 * ---------------------------------------------------------------------------
 * ONE RULE THIS MODULE LIVES BY
 * ---------------------------------------------------------------------------
 * `SuccessResponse` and `ErrorResponse` are mirrors: same leading fields, same
 * `meta`, differing only in `data` versus `error`. A client branches on
 * `success` alone and never inspects shape. Both embed `ResponseMeta` from
 * `shared/response`, so a field added there reaches both or neither compiles.
 *
 * ---------------------------------------------------------------------------
 * PLANNED — deliberately not built yet
 * ---------------------------------------------------------------------------
 *   response/etag.interceptor.ts       WITH read-heavy endpoints
 *     Conditional GET via `If-None-Match` → 304. Worth it once list endpoints
 *     are polled by a dashboard; pointless before there is traffic to save.
 *
 *   idempotency/                       WITH billing or any unsafe retry
 *     `Idempotency-Key` handling so a retried POST cannot double-charge or
 *     double-create. Requires Redis, so it lands after infrastructure/redis.
 *
 * ---------------------------------------------------------------------------
 * Deliberately NOT planned — these look like interceptors and are not
 * ---------------------------------------------------------------------------
 *   logging.interceptor    `pino-http autoLogging` already logs method, path,
 *                          status and duration for every request. A second one
 *                          would double every log line. If more is ever needed
 *                          it belongs in core/logger, next to the logger.
 *
 *   cache.interceptor      A URL-keyed cache cannot know that `GET /leads` for
 *                          one organization must not serve another's page. In a
 *                          multi-tenant app that is a data-leak vector. Cache
 *                          inside services, where organizationId is in scope.
 *
 *   serialization          Each module's `mappers/` builds responses field by
 *                          field — a whitelist. A global stripper is a
 *                          blacklist, so a new sensitive column leaks until
 *                          someone remembers to exclude it.
 *
 *   metrics / tracing /    Not interceptor concerns. Metrics needs a `/metrics`
 *   audit                  endpoint, tracing is an OTel SDK initialised in
 *                          bootstrap, audit needs a table and a query API.
 *                          Each is its own module.
 *
 *   ws-response            WebSocket messages are events, not request/response
 *                          pairs, and do not share this envelope. Build one
 *                          with the first gateway.
 */

export { InterceptorModule } from './interceptor.module.js';

export { RawResponse, ResponseMessage, SuccessResponseBuilder } from './response/index.js';

export type { SuccessResponse, SuccessResponseBuilderOptions } from './response/index.js';
