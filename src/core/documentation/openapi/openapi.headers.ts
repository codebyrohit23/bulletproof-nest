import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

import { DEVICE_ID_HEADER, WORKSPACE_ID_HEADER } from '#/shared/constants/index.js';

export function ApiDeviceIdHeader(): MethodDecorator {
  return applyDecorators(
    ApiHeader({
      name: DEVICE_ID_HEADER,
      required: true,
      description:
        'A stable, opaque identifier for this installation, generated once by the client and ' +
        'reused for its lifetime — a UUID in `localStorage` for web, keychain or ' +
        '`SharedPreferences` for native. Must be sent on every authenticated request ' +
        'thereafter: the session is bound to it.',
    }),
  );
}

/** For tenant routes. Applies to a whole controller as well as to one route. */
export function ApiWorkspaceIdHeader(): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    ApiHeader({
      name: WORKSPACE_ID_HEADER,
      required: true,
      description:
        'The workspace this request acts in — an `id` from `GET /v1/users/me/workspaces`. The ' +
        'caller must be an active member of it, and it must be active: a non-member gets 404, ' +
        'a member of a workspace that is pending, suspended or archived gets 403 with the reason.',
    }),
  );
}
