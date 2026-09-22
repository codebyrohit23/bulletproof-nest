import type { RequestContext } from '#/core/context/index.js';

import type { AdminDeviceContext } from '../interfaces/index.js';

export function resolveAdminDeviceContext(
  deviceId: string,
  context: Readonly<RequestContext> | undefined,
): AdminDeviceContext {
  return {
    deviceId,
    ...(context?.userAgent !== undefined ? { userAgent: context.userAgent } : {}),
    ...(context?.ip !== undefined ? { ipAddress: context.ip } : {}),
    ...(context?.geo?.countryCode !== undefined ? { countryCode: context.geo.countryCode } : {}),
    ...(context?.geo?.region !== undefined ? { region: context.geo.region } : {}),
    ...(context?.geo?.city !== undefined ? { city: context.geo.city } : {}),
  };
}
