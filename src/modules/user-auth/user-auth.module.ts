import { Module } from '@nestjs/common';

import { SessionValidator } from '#/core/auth/index.js';
import { EmailModule } from '#/core/communication/email/index.js';
import { UsersModule } from '#/modules/users/index.js';
import { VerificationModule } from '#/modules/verification/index.js';

import { UserSessionCacheService } from './cache/user-session.cache.js';
import { UserAuthController } from './controllers/user-auth.controller.js';
import {
  UserCredentialRepository,
  UserIdentityRepository,
  UserPasswordResetTokenRepository,
  UserRefreshTokenRepository,
  UserSessionRepository,
} from './repositories/index.js';
import { AuthTokenDeliveryService } from './services/auth-token-delivery.service.js';
import { UserAuthService } from './services/user-auth.service.js';
import { UserCredentialService } from './services/user-credential.service.js';
import { UserIdentityService } from './services/user-identity.service.js';
import { UserPasswordResetTokenService } from './services/user-password-reset-token.service.js';
import { UserRefreshTokenService } from './services/user-refresh-token.service.js';
import { UserSessionService } from './services/user-session.service.js';

/**
 * Authentication for end users of the product.
 *
 * Not `@Global()`. Nothing outside this module should reach into the
 * authentication tables directly — the guard and the principal every feature
 * module needs come from `core/auth` instead.
 *
 * The `users` table itself belongs to `UsersModule`, which this module imports:
 * signing in needs a user, but a user does not need to know how it signs in.
 * What stays here are the tables that exist only for authentication —
 * identities, credentials, sessions, refresh and reset tokens.
 *
 * `UserAuthService` orchestrates; the other services each own one table. The
 * controller depends only on the orchestrator, so a flow that grows a step does
 * not grow the controller.
 *
 * ---------------------------------------------------------------------------
 * THE ONE EXPORT, AND WHY IT IS AN ALIAS
 * ---------------------------------------------------------------------------
 * `core/auth` declares `SessionValidator` — the two questions its guard needs
 * answered about a session — and cannot implement it, because `user_sessions`
 * belongs here. So this module satisfies the port and exports the *token*, not
 * the service.
 *
 * `useExisting` rather than `useClass`: it aliases the same singleton rather
 * than constructing a second `UserSessionService`, which matters because a
 * second instance would be a second cache-eviction path — one of them evicting
 * entries the other still believes in.
 *
 * What escapes this module is therefore two methods, both about validating a
 * request. `startForDevice`, `revoke` and `revokeAllForUser` stay internal:
 * they are how sessions are *managed*, and management belongs to the flows in
 * here, not to whoever happens to be holding the port.
 *
 * `AppModule` — not this file and not `core/auth` — connects the two, so the
 * dependency arrow keeps pointing at `core`. See `AuthModule.forRoot`.
 */
@Module({
  imports: [UsersModule, VerificationModule, EmailModule],
  controllers: [UserAuthController],
  providers: [
    UserIdentityRepository,
    UserCredentialRepository,
    UserRefreshTokenRepository,
    UserPasswordResetTokenRepository,
    UserSessionRepository,

    UserSessionCacheService,

    UserIdentityService,
    UserCredentialService,
    UserRefreshTokenService,
    UserPasswordResetTokenService,
    UserSessionService,
    UserAuthService,
    AuthTokenDeliveryService,

    { provide: SessionValidator, useExisting: UserSessionService },
  ],
  exports: [SessionValidator],
})
export class UserAuthModule {}
