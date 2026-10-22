import type { Prisma } from '@prisma/client';

/** What a purge needs of a file: the objects to delete and the usage to give back. */
export const PURGE_FILE_SELECT = {
  id: true,
  visibility: true,
  objectKey: true,
  workspaceId: true,
  uploadedAt: true,
  sizeBytes: true,
  variants: {
    select: { objectKey: true, sizeBytes: true },
  },
} as const satisfies Prisma.StoredFileSelect;

export type PurgeFileRow = Prisma.StoredFileGetPayload<{ select: typeof PURGE_FILE_SELECT }>;
