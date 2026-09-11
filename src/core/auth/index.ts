export { AuthModule } from './auth.module.js';

export { Public } from './decorators/public.decorator.js';

export { SessionValidator } from './ports/session-validator.port.js';

export {
  AUTH_ERROR_MESSAGE,
  AUTH_FAILURE_REASON,
  AUTH_LOG_CONTEXT,
  type AuthFailureReason,
} from './constants/auth.constants.js';

export type {
  AuthenticatedSession,
  SessionFailureReason,
  SessionValidationResult,
  AuthModuleOptions,
} from './interfaces/index.js';
