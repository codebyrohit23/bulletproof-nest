import { Module } from '@nestjs/common';

import { AdminSessionValidator } from '#/core/auth/index.js';
import { AdminsModule } from '#/modules/admins/index.js';

import { AdminSessionCacheService } from './cache/admin-session.cache.js';
import { AdminAuthController } from './controllers/admin-auth.controller.js';
import {
  AdminCredentialRepository,
  AdminPasswordResetTokenRepository,
  AdminRefreshTokenRepository,
  AdminSessionRepository,
  AdminVerificationCodeRepository,
} from './repositories/index.js';
import { AdminAuthService } from './services/admin-auth.service.js';
import { AdminCredentialService } from './services/admin-credential.service.js';
import { AdminPasswordResetTokenService } from './services/admin-password-reset-token.service.js';
import { AdminRefreshTokenService } from './services/admin-refresh-token.service.js';
import { AdminSessionService } from './services/admin-session.service.js';
import { AdminTokenDeliveryService } from './services/admin-token-delivery.service.js';
import { AdminVerificationCodeService } from './services/admin-verification-code.service.js';

@Module({
  imports: [AdminsModule],
  controllers: [AdminAuthController],
  providers: [
    AdminCredentialRepository,
    AdminPasswordResetTokenRepository,
    AdminRefreshTokenRepository,
    AdminSessionRepository,
    AdminVerificationCodeRepository,

    AdminSessionCacheService,

    AdminCredentialService,
    AdminPasswordResetTokenService,
    AdminRefreshTokenService,
    AdminSessionService,
    AdminTokenDeliveryService,
    AdminVerificationCodeService,
    AdminAuthService,

    { provide: AdminSessionValidator, useExisting: AdminSessionService },
  ],
  exports: [AdminSessionValidator],
})
export class AdminAuthModule {}
