import { ADMIN_PATH_SEGMENT, API_AUDIENCE, type ApiAudienceKey } from '../constants/index.js';

export function resolveApiAudience(routePath: string): ApiAudienceKey {
  return routePath.includes(ADMIN_PATH_SEGMENT) ? API_AUDIENCE.ADMIN : API_AUDIENCE.USER;
}
