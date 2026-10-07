import { Injectable, type OnModuleInit, type Type } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants.js';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';

import { AppLoggerService } from '#/core/logger/index.js';
import { API_PREFIX } from '#/shared/constants/index.js';
import { resolveApiAudience } from '#/shared/utils/index.js';

import { PERMISSIONS_LOG_CONTEXT } from '../constants/index.js';
import { readRouteMarkers, resolveRouteRequirement } from '../utils/index.js';

@Injectable()
export class RouteAuthorizationAudit implements OnModuleInit {
  constructor(
    private readonly discovery: DiscoveryService,
    private readonly scanner: MetadataScanner,
    private readonly reflector: Reflector,
    private readonly logger: AppLoggerService,
  ) {}

  onModuleInit(): void {
    const faults: string[] = [];

    let audited = 0;

    for (const wrapper of this.discovery.getControllers()) {
      const { metatype } = wrapper;

      if (typeof metatype !== 'function') {
        continue;
      }

      /* A controller's metatype is its class — what `ExecutionContext.getClass()` returns per request. */
      const controller = metatype as Type<unknown>;

      const prototype = controller.prototype as Record<string, unknown>;

      for (const methodName of this.scanner.getAllMethodNames(prototype)) {
        const handler = prototype[methodName];

        if (typeof handler !== 'function' || !this.isRoute(handler)) {
          continue;
        }

        audited++;

        const markers = readRouteMarkers(this.reflector, handler, controller);

        const path = routePath(this.pathsOf(controller), this.pathsOf(handler));

        const result = resolveRouteRequirement(resolveApiAudience(path), markers);

        if (!result.ok) {
          faults.push(`${controller.name}.${methodName} (${path}): ${result.fault}`);
        }
      }
    }

    if (faults.length > 0) {
      const error = new Error(
        `Authorization is mis-wired on ${faults.length} route(s):\n  - ${faults.join('\n  - ')}`,
      );

      this.logger.error(error, 'Refusing to start: routes without a valid authorization marker', {
        context: PERMISSIONS_LOG_CONTEXT,
        operation: 'onModuleInit',
        metadata: { faults: faults.length, audited },
      });

      throw error;
    }

    this.logger.info('Every route carries a valid authorization marker', {
      context: PERMISSIONS_LOG_CONTEXT,
      operation: 'onModuleInit',
      metadata: { audited },
    });
  }

  /** A route handler is a method Nest put a path on; anything else is a helper. */
  private isRoute(handler: object): boolean {
    return Reflect.getMetadata(PATH_METADATA, handler) !== undefined;
  }

  private pathsOf(target: object): string {
    const path: unknown = Reflect.getMetadata(PATH_METADATA, target);

    if (Array.isArray(path)) {
      return typeof path[0] === 'string' ? path[0] : '';
    }

    return typeof path === 'string' ? path : '';
  }
}

function routePath(controllerPath: string, methodPath: string): string {
  const segments = [API_PREFIX, controllerPath, methodPath]
    .flatMap((part) => part.split('/'))
    .filter((segment) => segment.length > 0);

  return `/${segments.join('/')}`;
}
