import { Module } from '@nestjs/common';

import { UserSessionValidator } from '#/core/auth/index.js';
import { UsersModule } from '#/modules/users/index.js';

import { UserSessionCacheService } from './cache/user-session.cache.js';
import { UserAuthController } from './controllers/user-auth.controller.js';
import {
  UserCredentialRepository,
  UserIdentityRepository,
  UserPasswordResetTokenRepository,
  UserRefreshTokenRepository,
  UserSessionRepository,
  UserVerificationCodeRepository,
} from './repositories/index.js';
import { UserAuthService } from './services/user-auth.service.js';
import { UserCredentialService } from './services/user-credential.service.js';
import { UserIdentityService } from './services/user-identity.service.js';
import { UserPasswordResetTokenService } from './services/user-password-reset-token.service.js';
import { UserRefreshTokenService } from './services/user-refresh-token.service.js';
import { UserSessionService } from './services/user-session.service.js';
import { UserTokenDeliveryService } from './services/user-token-delivery.service.js';
import { UserVerificationCodeService } from './services/user-verification-code.service.js';
@Module({
  imports: [UsersModule],
  controllers: [UserAuthController],
  providers: [
    UserIdentityRepository,
    UserCredentialRepository,
    UserRefreshTokenRepository,
    UserPasswordResetTokenRepository,
    UserSessionRepository,
    UserVerificationCodeRepository,

    UserSessionCacheService,

    UserIdentityService,
    UserCredentialService,
    UserRefreshTokenService,
    UserPasswordResetTokenService,
    UserSessionService,
    UserVerificationCodeService,
    UserAuthService,
    UserTokenDeliveryService,

    { provide: UserSessionValidator, useExisting: UserSessionService },
  ],
  exports: [UserSessionValidator],
})
export class UserAuthModule {}
