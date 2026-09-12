import { REDIS_DOMAIN, buildRedisKey } from '#/infrastructure/redis/index.js';

import { RATE_LIMIT_SCOPE, RATE_LIMIT_VERSION_PREFIX } from '../constants/index.js';
import type { RateLimitKeyDescriptor } from '../interfaces/index.js';

/**
 * The only place rate-limit keys are assembled.
 *
 * Layout, mirroring cache so an operator reads both the same way:
 *
 *     rl:ws:<workspaceId>:v<n>:<resource>:<segments...>
 *     rl:global:v<n>:<resource>:<segments...>
 *
 * The `rl` namespace comes from the registry rather than being spelled out, so
 * every prefix in this Redis stays visible in one file.
 *
 * **No hash tags**, for the same reason cache avoids them: a tag forces every
 * key sharing it onto one cluster slot, and nothing here runs a multi-key
 * command. Each counter is touched on its own, and a composite limit is several
 * independent counters rather than one script over all of them.
 *
 * A note on what belongs in `segments`: the subject, and it should already be
 * opaque. Keys turn up in `SCAN` output, `MONITOR` and the slowlog, so an email
 * address or a phone number goes in as a digest, hashed by whoever owns the
 * rule. This function will not do it — it cannot know which segments are
 * personal and which are a purpose or a route.
 *
 * Pure: no DI, no Redis, no request context.
 */
export function buildTenantRateLimitKey(
  workspaceId: string,
  descriptor: RateLimitKeyDescriptor,
): string {
  return buildRedisKey(REDIS_DOMAIN.RATE_LIMIT, [
    RATE_LIMIT_SCOPE.TENANT,
    workspaceId,
    ...versionedResource(descriptor),
  ]);
}

/**
 * For limits that are not a tenant's.
 *
 * A separate function rather than a flag, so opting out of tenant isolation is
 * visible at the call site in review — and because most auth limits genuinely
 * have no tenant to scope by: there is no workspace in context until somebody
 * has signed in.
 */
export function buildGlobalRateLimitKey(descriptor: RateLimitKeyDescriptor): string {
  return buildRedisKey(REDIS_DOMAIN.RATE_LIMIT, [
    RATE_LIMIT_SCOPE.GLOBAL,
    ...versionedResource(descriptor),
  ]);
}

function versionedResource(descriptor: RateLimitKeyDescriptor): string[] {
  return [
    `${RATE_LIMIT_VERSION_PREFIX}${descriptor.version}`,
    descriptor.resource,
    ...descriptor.segments.map(String),
  ];
}
