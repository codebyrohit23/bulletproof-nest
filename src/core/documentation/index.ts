export {
  ApiAuthErrorResponses,
  ApiErrorResponses,
  ApiSuccessMessageResponse,
  ApiSuccessResponse,
} from './openapi/openapi.responses.js';

export { ApiDeviceIdHeader } from './openapi/openapi.headers.js';

export { API_AUDIENCES } from './openapi/openapi.config.js';

export { buildApiDocuments } from './openapi/openapi.document.js';

export {
  DOCS_PATH,
  DOCUMENTATION_LOG_CONTEXT,
  SECURITY_SCHEME,
} from './openapi/openapi.constants.js';

export { mountScalarReference } from './renderers/scalar.renderer.js';

export type {
  ApiAudience,
  ApiSuccessResponseOptions,
  DocumentedErrorStatus,
  ResponseDto,
} from './interfaces/index.js';
