/**
 * The whole of this module's public surface.
 *
 * Consumers import from here and never from a file inside — the repository and
 * the interfaces folder are internal, and reaching past this barrel is what
 * makes a boundary decorative.
 */

export {
  VERIFICATION_CODE_PATTERN,
  VERIFICATION_ERROR_MESSAGE,
  VERIFICATION_LOG_CONTEXT,
} from './constants/index.js';

export { VerificationCodeService } from './services/verification-code.service.js';

export { verificationPurposeFor } from './utils/index.js';

export { VerificationModule } from './verification.module.js';
