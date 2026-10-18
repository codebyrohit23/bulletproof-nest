import type { Readable } from 'node:stream';

import type { StorageBucket } from '../constants/index.js';

export interface PresignUploadInput {
  readonly bucket: StorageBucket;

  readonly key: string;

  /** Signed into the URL: an upload with any other `Content-Type` is refused by storage. */
  readonly contentType: string;

  readonly expiresInSeconds?: number;
}

/**
 * Everything a client needs to perform the upload, and nothing it should
 * compute. `headers` must be sent exactly as given.
 */
export interface PresignedUpload {
  readonly method: 'PUT';

  readonly url: string;

  readonly headers: Readonly<Record<string, string>>;

  readonly expiresAt: Date;
}

export interface PresignDownloadInput {
  readonly key: string;

  /** `attachment` makes a browser save rather than render it. */
  readonly disposition: 'inline' | 'attachment';

  /** Offered as the saved file's name. */
  readonly fileName?: string;

  readonly expiresInSeconds?: number;
}

export interface PresignedDownload {
  readonly url: string;

  readonly expiresAt: Date;
}

export interface ObjectHead {
  readonly sizeBytes: number;

  readonly contentType?: string;

  readonly etag?: string;
}

export interface PutObjectInput {
  readonly bucket: StorageBucket;

  readonly key: string;

  readonly body: Buffer | Uint8Array | Readable;

  readonly contentType: string;

  readonly cacheControl?: string;
}
