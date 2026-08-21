export {
  ApiAuthErrorResponses,
  ApiErrorResponses,
  ApiSuccessResponse,
} from './openapi/openapi.responses.js';

export { API_AUDIENCES } from './openapi/openapi.config.js';

export { buildApiDocuments } from './openapi/openapi.document.js';

export {
  ADMIN_PATH_SEGMENT,
  DOCS_PATH,
  DOCUMENTATION_LOG_CONTEXT,
  SECURITY_SCHEME,
} from './openapi/openapi.constants.js';

export { mountScalarReference } from './renderers/scalar.renderer.js';

export type { ApiAudience, ApiTag } from './documentation.types.js';

export type {
  ApiSuccessResponseOptions,
  DocumentedErrorStatus,
  ResponseDto,
} from './openapi/openapi.responses.js';

/*
 * What a feature module needs from here is small and stable:
 *
 *   - `ApiSuccessResponse` on every handler — it documents the response *and*
 *     enforces it at runtime, so the two cannot drift
 *   - `ApiErrorResponses` / `ApiAuthErrorResponses` on its controllers
 *   - `SECURITY_SCHEME.USER` or `.ADMIN` for `@ApiBearerAuth(...)`
 *   - an `ApiTag` of its own, exported from its own constants and registered
 *     in `openapi.tags.ts`
 *
 * Everything else — document generation, slicing, rendering — is consumed by
 * `bootstrap/documentation.bootstrap.ts` and by nothing else.
 *
 * ---------------------------------------------------------------------------
 * DELIBERATELY ABSENT
 * ---------------------------------------------------------------------------
 * **A Nest module.** There is nothing to inject: tags, schemes and response
 * shapes are static, and mounting requires the application instance, which
 * exists only in bootstrap. A module here would either wrap constants in
 * ceremony or reach for `HttpAdapterHost` to get back the thing that already
 * contains it.
 *
 * **A combined reference.** Scalar can render several specifications in one
 * page behind a selector, and it is the wrong choice here: a single page means
 * anyone holding the public documentation URL can switch to the administrative
 * one and read every endpoint, payload and field name. Two mounts keep the two
 * audiences genuinely separate. It would be the right choice for a team that
 * needs both at once.
 */
