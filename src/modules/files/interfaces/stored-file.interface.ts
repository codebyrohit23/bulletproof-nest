import type {
  FilePurpose,
  FileRejectReason,
  FileStatus,
  FileVariantKind,
  FileVisibility,
} from '@prisma/client';

/** A `files` row as this module reads it. `sizeBytes` is a number: no file nears 2⁵³. */
export interface StoredFileSnapshot {
  readonly id: string;

  readonly workspaceId: string | null;

  readonly uploadedByUserId: string | null;

  readonly uploadedByAdminId: string | null;

  readonly purpose: FilePurpose;

  readonly visibility: FileVisibility;

  readonly status: FileStatus;

  readonly rejectReason: FileRejectReason | null;

  readonly objectKey: string;

  readonly originalName: string;

  readonly declaredMimeType: string;

  readonly detectedMimeType: string | null;

  readonly sizeBytes: number;

  readonly width: number | null;

  readonly height: number | null;

  readonly durationMs: number | null;

  readonly expiresAt: Date | null;

  readonly attachedAt: Date | null;

  readonly createdAt: Date;

  readonly variants: readonly StoredFileVariantSnapshot[];
}

export interface StoredFileVariantSnapshot {
  readonly kind: FileVariantKind;

  readonly objectKey: string;

  readonly width: number;

  readonly height: number;
}

export interface CreateStoredFileInput {
  readonly id: string;

  readonly workspaceId: string | null;

  readonly uploadedByUserId: string | null;

  readonly uploadedByAdminId: string | null;

  readonly purpose: FilePurpose;

  readonly visibility: FileVisibility;

  readonly objectKey: string;

  readonly originalName: string;

  readonly declaredMimeType: string;

  readonly sizeBytes: number;

  readonly expiresAt: Date;
}
