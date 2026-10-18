import { S3Client } from '@aws-sdk/client-s3';

import type { StorageConfigService } from '#/config/storage/index.js';

import { STORAGE_CONNECTION_TIMEOUT_MS } from '../constants/index.js';

/**
 * Builds the S3 client. The only place in the codebase that constructs one.
 *
 * The checksum settings are not optional. Since 3.729 the SDK adds a CRC32
 * checksum to every request it can (`WHEN_SUPPORTED`); on a presigned PUT that
 * puts a checksum parameter in the URL that a browser upload cannot satisfy, so
 * every client upload fails its signature. `WHEN_REQUIRED` keeps checksums for
 * the operations that demand one (`DeleteObjects`) and nowhere else.
 */
export function createS3Client(config: StorageConfigService): S3Client {
  return new S3Client({
    endpoint: config.endpoint,

    region: config.region,

    credentials: config.credentials,

    forcePathStyle: config.forcePathStyle,

    requestChecksumCalculation: 'WHEN_REQUIRED',

    responseChecksumValidation: 'WHEN_REQUIRED',

    requestHandler: {
      connectionTimeout: STORAGE_CONNECTION_TIMEOUT_MS,

      requestTimeout: config.requestTimeoutMs,
    },
  });
}
