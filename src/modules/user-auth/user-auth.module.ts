import { Module } from '@nestjs/common';

import { UserSessionValidator } from '#/core/auth/index.js';
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
@Module({
  imports: [UsersModule, VerificationModule],
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

    { provide: UserSessionValidator, useExisting: UserSessionService },
  ],
  exports: [UserSessionValidator],
})
export class UserAuthModule {}
