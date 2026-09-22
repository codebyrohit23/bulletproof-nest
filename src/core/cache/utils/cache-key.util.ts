import { REDIS_KEY_SEPARATOR } from '#/config/redis/index.js';

import { CACHE_DOMAIN, CACHE_SCOPE, CACHE_VERSION_PREFIX } from '../constants/index.js';
import type { CacheKeyDescriptor } from '../interfaces/index.js';

export function buildTenantCacheKey(workspaceId: string, descriptor: CacheKeyDescriptor): string {
  return join([CACHE_DOMAIN, CACHE_SCOPE.TENANT, workspaceId, ...versionedResource(descriptor)]);
}

export function buildGlobalCacheKey(descriptor: CacheKeyDescriptor): string {
  return join([CACHE_DOMAIN, CACHE_SCOPE.GLOBAL, ...versionedResource(descriptor)]);
}

export function buildTenantCachePrefix(workspaceId: string): string {
  return `${join([CACHE_DOMAIN, CACHE_SCOPE.TENANT, workspaceId])}${REDIS_KEY_SEPARATOR}`;
}

export function buildTenantResourcePrefix(
  workspaceId: string,
  resource: string,
  version: number,
): string {
  return `${join([
    CACHE_DOMAIN,
    CACHE_SCOPE.TENANT,
    workspaceId,
    formatVersion(version),
    resource,
  ])}${REDIS_KEY_SEPARATOR}`;
}

export function buildGlobalResourcePrefix(resource: string, version: number): string {
  return `${join([CACHE_DOMAIN, CACHE_SCOPE.GLOBAL, formatVersion(version), resource])}${REDIS_KEY_SEPARATOR}`;
}

function versionedResource(descriptor: CacheKeyDescriptor): string[] {
  return [
    formatVersion(descriptor.version),
    descriptor.resource,
    ...descriptor.segments.map(String),
  ];
}

function formatVersion(version: number): string {
  return `${CACHE_VERSION_PREFIX}${version}`;
}

function join(segments: readonly string[]): string {
  return segments.join(REDIS_KEY_SEPARATOR);
}
