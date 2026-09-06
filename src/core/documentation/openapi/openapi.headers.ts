import { applyDecorators } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

import { DEVICE_ID_HEADER } from '#/core/context/index.js';

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
