import { type DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import type { AuthModuleOptions } from '#/core/auth/interfaces/auth-session.interface.js';

import { UserAuthGuard } from './guards/user-auth.guard.js';

/**
 * Guards are bound here through `APP_GUARD`, so each is built once inside this
 * module — where `SessionValidator` is visible — rather than inside every
 * controller's module. Providers run in the order listed; the authorization
 * guards join this list after `UserAuthGuard` when they land.
 */
@Module({})
export class AuthModule {
  static forRoot(options: AuthModuleOptions): DynamicModule {
    return {
      module: AuthModule,
      global: true,
      imports: options.imports,
      providers: [UserAuthGuard, { provide: APP_GUARD, useExisting: UserAuthGuard }],
    };
  }
}
