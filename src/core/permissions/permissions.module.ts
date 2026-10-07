import { type DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD, DiscoveryModule } from '@nestjs/core';

import { PermissionGuard } from './guards/permission.guard.js';
import type { PermissionsModuleOptions } from './interfaces/index.js';
import { RouteAuthorizationAudit } from './services/route-authorization-audit.service.js';

/**
 * Wiring only. `options.imports` must provide both resolver ports; `AppModule`
 * is the one place entitled to know which modules do, the `AuthModule.forRoot`
 * pattern.
 *
 * Register after `TenancyModule`: global guards run in registration order, and
 * `PermissionGuard` reads the user, workspace and member the earlier guards put
 * in context.
 *
 * Not global, and exports nothing: the guard is bound through `APP_GUARD`, the
 * decorators are plain functions, and a module that needs a grant — the access
 * endpoint — injects the resolver its own module provides.
 */
@Module({})
export class PermissionsModule {
  static forRoot(options: PermissionsModuleOptions): DynamicModule {
    return {
      module: PermissionsModule,
      imports: [DiscoveryModule, ...options.imports],
      providers: [
        PermissionGuard,
        RouteAuthorizationAudit,
        { provide: APP_GUARD, useExisting: PermissionGuard },
      ],
    };
  }
}
