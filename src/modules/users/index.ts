/**
 * The whole of this module's public surface.
 *
 * Consumers import from here and never from a file inside — the repository is
 * internal, and reaching past this barrel is what makes a boundary decorative.
 */

export { USER_PROFILE_API_TAG } from './constants/index.js';

export type { CreateUserInput, UserSnapshot } from './interfaces/index.js';

export { UserService } from './services/user.service.js';

export { UsersModule } from './users.module.js';
