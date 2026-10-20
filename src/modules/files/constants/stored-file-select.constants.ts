import type { Prisma } from '@prisma/client';

export const STORED_FILE_SELECT = {
  id: true,
  workspaceId: true,
  uploadedByUserId: true,
  uploadedByAdminId: true,
  purpose: true,
  visibility: true,
  status: true,
  rejectReason: true,
  objectKey: true,
  originalName: true,
  declaredMimeType: true,
  detectedMimeType: true,
  sizeBytes: true,
  width: true,
  height: true,
  durationMs: true,
  expiresAt: true,
  attachedAt: true,
  createdAt: true,
  variants: {
    select: { kind: true, objectKey: true, width: true, height: true },
  },
} as const satisfies Prisma.StoredFileSelect;

export type StoredFileRow = Prisma.StoredFileGetPayload<{ select: typeof STORED_FILE_SELECT }>;
