export const STORAGE_DEFAULTS = {
  /** What R2 requires. MinIO accepts any value; AWS wants the bucket's region. */
  REGION: 'auto',

  REQUEST_TIMEOUT_MS: 10_000,
} as const;

/** S3 and R2 rules alike: 3–63 lowercase letters, digits and hyphens. */
export const STORAGE_BUCKET_NAME_PATTERN = /^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/;
