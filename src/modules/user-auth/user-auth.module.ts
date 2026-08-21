import { Module } from '@nestjs/common';

import { UserAuthController } from './controllers/user-auth.controller.js';
import {
  UserCredentialRepository,
  UserIdentityRepository,
  UserRepository,
  VerificationCodeRepository,
} from './repositories/index.js';
import { UserAuthService } from './services/user-auth.service.js';
import { UserCredentialService } from './services/user-credential.service.js';
import { UserIdentityService } from './services/user-identity.service.js';
import { UserService } from './services/user.service.js';
import { VerificationCodeService } from './services/verification-code.service.js';

/**
 * Authentication for end users of the product.
 *
 * Not `@Global()`. Nothing outside this module should reach into the user
 * tables directly — the guard and the principal every feature module needs come
 * from `core/auth` instead.
 *
 * `UserAuthService` orchestrates; the other three each own one table. The
 * controller depends only on the orchestrator, so a flow that grows a step does
 * not grow the controller.
 */
@Module({
  imports: [],
  controllers: [UserAuthController],
  providers: [
    UserRepository,
    UserIdentityRepository,
    UserCredentialRepository,
    VerificationCodeRepository,

    UserService,
    UserIdentityService,
    UserCredentialService,
    VerificationCodeService,
    UserAuthService,
  ],
  exports: [],
})
export class UserAuthModule {}
