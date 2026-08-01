import type { INestApplication } from '@nestjs/common';
import { RequestMethod, VersioningType } from '@nestjs/common';

import { API_PREFIX, API_VERSION_PREFIX, ApiVersion } from '@/shared/constants/index.js';

export function configureVersioning(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX, {
    exclude: [
      {
        path: 'health',
        method: RequestMethod.ALL,
      },
      {
        path: 'health/*path',
        method: RequestMethod.ALL,
      },
      {
        path: 'admin/*path',
        method: RequestMethod.ALL,
      },
    ],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: API_VERSION_PREFIX,
    defaultVersion: ApiVersion.V1,
  });
}
