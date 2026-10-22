export const FILE_JOB = {
  PROCESS: 'files.process',
  PURGE_UNATTACHED: 'files.purge-unattached',
  PURGE_DELETED: 'files.purge-deleted',
} as const;

export const CONTENT_SNIFF_BYTES = 4_100;

export const MAX_INPUT_PIXELS = 50_000_000;

export const WEBP_QUALITY = 82;

export const PUBLIC_OBJECT_CACHE_CONTROL = 'public, max-age=31536000, immutable';
