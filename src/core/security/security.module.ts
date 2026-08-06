import { Global, Module } from '@nestjs/common';

import { PasswordService } from './services/password.service.js';
import { TokenService } from './services/token.service.js';

/**
 * Cryptographic primitives.
 *
 * `@Global()` because auth, invitations and API keys all need them, and none of
 * those should have to import this module to hash a value.
 *
 * Distinct from `config/security`, which holds security *settings* — CORS,
 * helmet, the cookie secret. This module holds security *primitives*: it
 * transforms secrets and knows nothing about HTTP.
 */
@Global()
@Module({
  providers: [PasswordService, TokenService],
  exports: [PasswordService, TokenService],
})
export class SecurityModule {}
