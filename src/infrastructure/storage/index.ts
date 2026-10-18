/**
 * Object storage.
 *
 * Owns: the S3 client, bucket names, presigned URLs, object reads, writes and
 * deletes, and the health probe.
 *
 * Does NOT own: what a file is for, who may upload it, its size or type
 * limits, its key layout or its lifecycle — those are `modules/files`
 * decisions. Nothing here knows what a user, a workspace or an avatar is.
 *
 * The provider and utils are not exported: `ObjectStorageService` is the only
 * supported way to reach storage, because a client built elsewhere would skip
 * the checksum settings presigned uploads depend on.
 */

export { StorageModule } from './storage.module.js';

export { ObjectStorageService } from './object-storage.service.js';

export { StorageHealthIndicator } from './indicators/storage-health.indicator.js';

export { ObjectNotFoundError } from './errors/index.js';

export {
  STORAGE_BUCKET,
  STORAGE_HEALTH_KEY,
  STORAGE_URL_TTL_SECONDS,
  type StorageBucket,
} from './constants/index.js';

export type {
  ObjectHead,
  PresignDownloadInput,
  PresignUploadInput,
  PresignedDownload,
  PresignedUpload,
  PutObjectInput,
} from './interfaces/index.js';
