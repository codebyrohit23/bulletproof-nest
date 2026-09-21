export { AuthModule } from './auth.module.js';

export { Public } from './decorators/public.decorator.js';

export { AdminSessionValidator, UserSessionValidator } from './ports/index.js';

export {
  AUTH_ERROR_MESSAGE,
  AUTH_FAILURE_REASON,
  AUTH_LOG_CONTEXT,
  type AuthFailureReason,
} from './constants/index.js';

export type {
  AdminSessionValidationResult,
  AuthenticatedAdminSession,
  AuthenticatedUserSession,
  AuthModuleOptions,
  SessionFailureReason,
  UserSessionValidationResult,
} from './interfaces/index.js';
