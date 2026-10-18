/**
 * Which bucket, by role. Callers name a role; only `ObjectStorageService`
 * knows the bucket names, which come from config and differ per environment.
 */
export const STORAGE_BUCKET = {
  PUBLIC: 'public',
  PRIVATE: 'private',
} as const;

export type StorageBucket = (typeof STORAGE_BUCKET)[keyof typeof STORAGE_BUCKET];

/**
 * Signed URL lifetimes. Short, because a signed URL is a bearer credential:
 * anyone holding it can use it until it expires, and nothing can revoke it.
 */
export const STORAGE_URL_TTL_SECONDS = {
  /** Long enough to start a 100 MB upload on a slow connection. */
  UPLOAD: 5 * 60,

  /** Long enough for a page of thumbnails to load; re-requested after. */
  DOWNLOAD: 10 * 60,
} as const;

/** Headers a presigned upload signs, so storage refuses a request that changes them. */
export const SIGNED_UPLOAD_HEADERS: ReadonlySet<string> = new Set(['content-type']);

/** The most keys one `DeleteObjects` call accepts, on S3 and R2 alike. */
export const STORAGE_DELETE_BATCH_SIZE = 1_000;

export const STORAGE_CONNECTION_TIMEOUT_MS = 3_000;

export const STORAGE_HEALTH_KEY = 'storage';

/** Probes run far more often than traffic, so they get their own short deadline. */
export const STORAGE_HEALTH_TIMEOUT_MS = 3_000;
