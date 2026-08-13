import { Module } from '@nestjs/common';

import { UserIdentityRepository, UserRepository } from './repositories/index.js';

/**
 * Authentication for end users of the product.
 *
 * Not `@Global()`. Nothing outside this module should reach into the user
 * tables directly — the guard and the principal every feature module needs come
 * from `core/auth` instead.
 *
 * Currently repositories only; services, controllers and DTOs follow.
 */
@Module({
  providers: [UserRepository, UserIdentityRepository],
  exports: [UserRepository, UserIdentityRepository],
})
export class UserAuthModule {}
