export { AuthModule } from './auth.module.js';

export { UserAuthGuard } from './guards/user-auth.guard.js';

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
