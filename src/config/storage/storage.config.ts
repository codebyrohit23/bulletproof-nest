import { registerAs } from '@nestjs/config';

import { env } from '../shared/env.js';

import type { StorageConfig } from './storage.interface.js';

export const storageConfig = registerAs('storage', (): StorageConfig => {
  // One bucket for both would put every private file behind the public CDN.
  if (env.STORAGE_PRIVATE_BUCKET === env.STORAGE_PUBLIC_BUCKET) {
    throw new Error(
      'STORAGE_PRIVATE_BUCKET and STORAGE_PUBLIC_BUCKET must name different buckets.',
    );
  }

  return {
    endpoint: env.STORAGE_ENDPOINT,

    region: env.STORAGE_REGION,

    credentials: {
      accessKeyId: env.STORAGE_ACCESS_KEY_ID,

      secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
    },

    forcePathStyle: env.STORAGE_FORCE_PATH_STYLE,

    requestTimeoutMs: env.STORAGE_REQUEST_TIMEOUT_MS,

    buckets: {
      private: env.STORAGE_PRIVATE_BUCKET,

      public: env.STORAGE_PUBLIC_BUCKET,
    },

    publicBaseUrl: env.STORAGE_PUBLIC_BASE_URL,
  };
});
