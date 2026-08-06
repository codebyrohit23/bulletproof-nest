import { REDIS_KEY_SEPARATOR } from '#/config/redis/index.js';

import { CACHE_DOMAIN, CACHE_SCOPE, CACHE_VERSION_PREFIX } from '../constants/cache.constants.js';
import type { CacheKeyDescriptor } from '../interfaces/index.js';

/**
 * The only place cache keys are assembled.
 *
 * Layout:
 *
 *     cache:org:<organizationId>:v<n>:<resource>:<segments...>
 *     cache:global:v<n>:<resource>:<segments...>
 *
 * Deliberately **no hash tags**. A tag forces every key sharing it onto one
 * cluster slot, which concentrates a large tenant on a single node and buys
 * nothing unless a single command spans those keys. Cache reads are individual
 * `GET`s, and tenant-wide invalidation is solved by bumping a version rather
 * than by co-locating keys. Tags belong only where a multi-key command or a Lua
 * script genuinely requires them — BullMQ's queue prefix being the clear case.
 *
 * Pure: no DI, no Redis, no request context.
 */

export function buildTenantCacheKey(organizationId: string, descriptor: CacheKeyDescriptor): string {
  return join([CACHE_DOMAIN, CACHE_SCOPE.TENANT, organizationId, ...versionedResource(descriptor)]);
}

/**
 * For entities that genuinely span tenants — a user identity, a verification
 * code, an IP rate-limit counter.
 *
 * Separate function rather than a flag so that opting out of tenant isolation
 * is visible in review at the call site.
 */
export function buildGlobalCacheKey(descriptor: CacheKeyDescriptor): string {
  return join([CACHE_DOMAIN, CACHE_SCOPE.GLOBAL, ...versionedResource(descriptor)]);
}

/**
 * Prefix covering every cached entry for one tenant.
 *
 * Useful for an operator dropping a tenant's cache by hand. Application code
 * should prefer a version bump — that is O(1) and needs no scan.
 */
export function buildTenantCachePrefix(organizationId: string): string {
  return `${join([CACHE_DOMAIN, CACHE_SCOPE.TENANT, organizationId])}${REDIS_KEY_SEPARATOR}`;
}

/**
 * Prefix covering every cached entry for one resource within a tenant, at a
 * given version — what a module's `invalidate*` method deletes.
 */
export function buildTenantResourcePrefix(organizationId: string, resource: string, version: number): string {
  return `${join([
    CACHE_DOMAIN,
    CACHE_SCOPE.TENANT,
    organizationId,
    formatVersion(version),
    resource,
  ])}${REDIS_KEY_SEPARATOR}`;
}

export function buildGlobalResourcePrefix(resource: string, version: number): string {
  return `${join([CACHE_DOMAIN, CACHE_SCOPE.GLOBAL, formatVersion(version), resource])}${REDIS_KEY_SEPARATOR}`;
}

function versionedResource(descriptor: CacheKeyDescriptor): string[] {
  return [formatVersion(descriptor.version), descriptor.resource, ...descriptor.segments.map(String)];
}

function formatVersion(version: number): string {
  return `${CACHE_VERSION_PREFIX}${version}`;
}

function join(segments: readonly string[]): string {
  return segments.join(REDIS_KEY_SEPARATOR);
}
