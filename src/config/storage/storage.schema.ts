import { z } from 'zod';

import { booleanEnv, positiveIntEnv } from '../shared/index.js';

import { STORAGE_BUCKET_NAME_PATTERN, STORAGE_DEFAULTS } from './storage.constants.js';

const bucketName = z
  .string()
  .regex(STORAGE_BUCKET_NAME_PATTERN, 'must be 3–63 lowercase letters, digits or hyphens');

/**
 * `STORAGE_*`, not `R2_*`: R2, MinIO and S3 speak one protocol, so the vendor
 * is the endpoint and nothing else.
 *
 * The two buckets must differ. That is checked in `storage.config.ts`, not
 * here: `envSchema` spreads `.shape`, which drops an object-level refinement
 * without a word.
 */
export const storageSchema = z.object({
  STORAGE_ENDPOINT: z.url(),

  STORAGE_REGION: z.string().min(1).default(STORAGE_DEFAULTS.REGION),

  STORAGE_ACCESS_KEY_ID: z.string().min(1),

  STORAGE_SECRET_ACCESS_KEY: z.string().min(1),

  /** MinIO needs path-style addressing; R2 and S3 do not. */
  STORAGE_FORCE_PATH_STYLE: booleanEnv('false'),

  STORAGE_REQUEST_TIMEOUT_MS: positiveIntEnv(STORAGE_DEFAULTS.REQUEST_TIMEOUT_MS),

  STORAGE_PRIVATE_BUCKET: bucketName,

  STORAGE_PUBLIC_BUCKET: bucketName,

  /** The CDN origin in front of the public bucket. Never `r2.dev` in production: it is rate-limited. */
  STORAGE_PUBLIC_BASE_URL: z.url().transform((value) => value.replace(/\/+$/, '')),
});
